const fs = require('fs');
const path = require('path');
const pdfParseModule = require('pdf-parse');

async function safePdfParse(pdfBuffer) {
  if (typeof pdfParseModule === 'function') {
    const data = await pdfParseModule(pdfBuffer);
    return { text: data.text || '' };
  }
  if (pdfParseModule.PDFParse) {
    const u8 = new Uint8Array(pdfBuffer);
    const parser = new pdfParseModule.PDFParse(u8);
    await parser.load();
    const textData = await parser.getText();
    let text = typeof textData === 'string' ? textData : (textData?.text || '');
    return { text };
  }
  if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
    const data = await pdfParseModule.default(pdfBuffer);
    return { text: data.text || '' };
  }
  return { text: '' };
}

const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const College = require('../models/College');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CollegeTrainingEnrollment = require('../models/CollegeTrainingEnrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const StudentTask = require('../models/StudentTask');
const DailyTeachingUpdate = require('../models/DailyTeachingUpdate');
const BatchDailyReport = require('../models/BatchDailyReport');
const EmailLog = require('../models/EmailLog');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const TrainerProfile = require('../models/TrainerProfile');
const StudentModuleStatus = require('../models/StudentModuleStatus');
const { generateDailyReportPDF } = require('../services/batchPdfReportService');
const { sendDailyReportEmail } = require('../services/batchEmailService');

/**
 * Helper: Synchronize tutor assignment across Batch, TrainerProfile, StudentProfile, CollegeTrainingEnrollment, and Sessions.
 */
async function syncBatchTutor(batchId, newTutorId, oldTutorId = null) {
  if (!newTutorId) return;

  const newTutorIdObj = new mongoose.Types.ObjectId(newTutorId);
  const oldTutorIdObj = oldTutorId ? new mongoose.Types.ObjectId(oldTutorId) : null;

  // 1. If old tutor exists and is different, remove this batch from their TrainerProfile
  if (oldTutorIdObj && oldTutorIdObj.toString() !== newTutorIdObj.toString()) {
    await TrainerProfile.updateOne(
      { userId: oldTutorIdObj },
      { $pull: { assignedBatches: batchId } }
    );
  }

  // 2. Add batch to new tutor's TrainerProfile
  await TrainerProfile.updateOne(
    { userId: newTutorIdObj },
    { $addToSet: { assignedBatches: batchId } }
  );

  // 3. Find batch to get studentIds
  const batch = await Batch.findById(batchId);
  if (batch && batch.studentIds && batch.studentIds.length > 0) {
    // 4. Update assignedTutorId on all student profiles in this batch
    await StudentProfile.updateMany(
      { userId: { $in: batch.studentIds } },
      { $set: { assignedTutorId: newTutorIdObj } }
    );

    // 5. Update CollegeTrainingEnrollment if applicable
    await CollegeTrainingEnrollment.updateMany(
      { collegeTrainingBatchId: batchId },
      { $set: { tutorId: newTutorIdObj } }
    );
  }

  // 6. Update upcoming sessions
  await Session.updateMany(
    { batchId, status: { $ne: 'COMPLETED' } },
    { $set: { tutorId: newTutorIdObj } }
  );
}

/**
 * Helper: Validate that all student user IDs are enrolled in the batch's course.
 */
async function validateStudentsCourseEnrollment(studentUserIds, targetCourseId) {
  if (!studentUserIds || studentUserIds.length === 0) return { valid: true };
  if (!targetCourseId) return { valid: false, message: 'Please select a Course / Domain for the batch.' };

  let targetCourse = null;
  if (mongoose.Types.ObjectId.isValid(targetCourseId)) {
    targetCourse = await Course.findById(targetCourseId);
  }
  if (!targetCourse) {
    targetCourse = await Course.findOne({
      $or: [
        { slug: targetCourseId.toString().toLowerCase() },
        { title: new RegExp(`^${targetCourseId.toString().trim()}$`, 'i') }
      ]
    });
  }

  if (!targetCourse) {
    return { valid: false, message: 'Invalid course selected. Please select a registered Course / Domain.' };
  }

  const profiles = await StudentProfile.find({ userId: { $in: studentUserIds } })
    .populate('userId', 'name studentId username')
    .populate('enrolledCourseId', 'title slug category');

  for (const p of profiles) {
    const studentCourseId = p.enrolledCourseId?._id?.toString() || p.enrolledCourseId?.toString();
    const targetCourseIdStr = targetCourse._id.toString();

    // Check if enrolled course matches or if domain matches
    const courseMatches = studentCourseId === targetCourseIdStr ||
      (p.domain && targetCourse.slug && p.domain.toLowerCase() === targetCourse.slug.toLowerCase());

    if (!courseMatches) {
      const studentName = p.userId?.name || p.studentId || 'Student';
      const actualCourseName = p.enrolledCourseId?.title || (p.domain ? p.domain.toUpperCase() : 'Unassigned Course');
      return {
        valid: false,
        message: `Student '${studentName}' (${p.studentId || p.userId?.studentId || ''}) is enrolled in '${actualCourseName}', not '${targetCourse.title}'. Only students enrolled in '${targetCourse.title}' can be added to this batch.`
      };
    }
  }

  return { valid: true, targetCourse };
}

/**
 * Helper: Map Academic Year to Roman Numeral
 */
const toRomanYear = (yearStr) => {
  const str = String(yearStr || '').toLowerCase();
  if (str.includes('4') || str.includes('fourth') || str.includes('iv')) return 'IV';
  if (str.includes('3') || str.includes('third') || str.includes('iii')) return 'III';
  if (str.includes('2') || str.includes('second') || str.includes('ii')) return 'II';
  return 'I';
};

/**
 * Helper: Generate 6-character initial password for batch students
 * (e.g., IT -> IT0001, CSE -> CSE001, MECH -> MECH01, all guaranteed >= 6 chars)
 */
const generateStudentInitialPassword = (deptPrefix, seq) => {
  const cleanDept = (deptPrefix || 'ST').trim().toUpperCase().replace(/[^A-Z]/g, '') || 'ST';
  const padLength = Math.max(2, 6 - cleanDept.length);
  const passSeqStr = String(seq).padStart(padLength, '0');
  let pwd = `${cleanDept}${passSeqStr}`;
  if (pwd.length < 6) {
    pwd = pwd.padEnd(6, '0');
  }
  return pwd;
};

/**
 * POST /api/admin/batches/parse-pdf
 * Parse PDF file or text content to extract student roster
 */
exports.parseStudentPdf = async (req, res) => {
  try {
    let text = '';
    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      const data = await safePdfParse(buffer);
      text = data.text;
      // Clean temp file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    } else if (req.body.rawText) {
      text = req.body.rawText;
    } else {
      return res.status(400).json({ success: false, message: 'No file or raw text uploaded.' });
    }

    // Split lines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsedStudents = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const seenEmailsInFile = new Set();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const foundEmails = line.match(emailRegex);

      if (foundEmails && foundEmails.length > 0) {
        const email = foundEmails[0].toLowerCase();
        
        // Extract Name: tokens before email
        const parts = line.replace(email, '').split(/[,|\t;]+/);
        let name = parts[0] ? parts[0].replace(/[^a-zA-Z\s.]/g, '').trim() : '';
        if (!name || name.length < 2) {
          name = `Student ${parsedStudents.length + 1}`;
        }

        // Extract Department if present in line
        let dept = 'CSE';
        if (/CSE|Computer/i.test(line)) dept = 'CSE';
        else if (/IT|Information/i.test(line)) dept = 'IT';
        else if (/ECE|Electronics/i.test(line)) dept = 'ECE';
        else if (/AIDS|AI|Data/i.test(line)) dept = 'AIDS';
        else if (/MECH|Mechanical/i.test(line)) dept = 'MECH';

        // Extract Year if present
        let year = '1st Year';
        if (/4th|Fourth|IV/i.test(line)) year = '4th Year';
        else if (/3rd|Third|III/i.test(line)) year = '3rd Year';
        else if (/2nd|Second|II/i.test(line)) year = '2nd Year';

        let isValid = true;
        let errorReason = '';

        if (seenEmailsInFile.has(email)) {
          isValid = false;
          errorReason = 'Duplicate email in file';
        } else {
          seenEmailsInFile.add(email);
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            isValid = false;
            errorReason = 'Email already exists in database';
          }
        }

        parsedStudents.push({
          name,
          email,
          department: dept,
          academicYear: year,
          isValid,
          errorReason
        });
      }
    }

    return res.json({
      success: true,
      totalFound: parsedStudents.length,
      validCount: parsedStudents.filter(s => s.isValid).length,
      preview: parsedStudents
    });
  } catch (error) {
    console.error('parseStudentPdf error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/batches/create-full
 * Create full training batch cohort and generate student user accounts
 */
exports.createFullBatch = async (req, res) => {
  try {
    const {
      name,
      code,
      batchType,
      academicYear = '1st Year',
      collegeId,
      department = 'CSE',
      courseId,
      trainerId,
      tutorId,
      mode = 'ONLINE',
      description = '',
      startDate,
      endDate,
      saturdayIncluded = false,
      sundayIncluded = false,
      trainingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime = '09:00 AM',
      endTime = '04:30 PM',
      breakStartTime = '01:00 PM',
      breakEndTime = '02:00 PM',
      dailyReportTime = '18:00',
      holidays = [],
      collegeGuideName = '',
      collegeGuideEmail = '',
      placementOfficeEmail = '',
      hodName = '',
      hodEmail = '',
      tutorResumeUrl = '',
      students = [],
      studentIds = []
    } = req.body;

    // Determine target batch type
    const targetBatchType = batchType || (collegeId ? 'COLLEGE_TRAINING' : 'LMS');

    // Field-specific validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch Name is required.' });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Batch Code is required.' });
    }

    if (targetBatchType === 'COLLEGE_TRAINING') {
      if (!collegeId) {
        return res.status(400).json({ success: false, message: 'College is required for College Training batches.' });
      }
      if (!mongoose.Types.ObjectId.isValid(collegeId)) {
        return res.status(400).json({ success: false, message: 'A valid College is required for College Training batches.' });
      }
    }

    // Check code uniqueness
    const normCode = code.trim().toUpperCase();
    const existingCode = await Batch.findOne({ code: normCode });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Batch Code '${normCode}' already exists.` });
    }

    // Resolve courseId if provided as ObjectId or typed text
    let resolvedCourseId = null;
    if (courseId) {
      if (courseId.toString().match(/^[0-9a-fA-F]{24}$/)) {
        resolvedCourseId = courseId;
      } else {
        const matchedCourse = await Course.findOne({
          $or: [
            { title: { $regex: new RegExp(courseId.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i') } },
            { slug: courseId.trim().toLowerCase() }
          ]
        });
        if (matchedCourse) resolvedCourseId = matchedCourse._id;
      }
    }

    if (!resolvedCourseId) {
      return res.status(400).json({ success: false, message: 'A valid Course / Domain is required before creating a batch.' });
    }

    // Resolve trainerId / tutorId if provided as ObjectId or typed text
    let resolvedTrainerId = null;
    const rawTrainer = tutorId || trainerId;
    if (rawTrainer) {
      if (rawTrainer.toString().match(/^[0-9a-fA-F]{24}$/)) {
        resolvedTrainerId = rawTrainer;
      } else {
        const matchedTrainer = await User.findOne({
          role: { $in: ['tutor', 'trainer', 'admin'] },
          $or: [
            { name: { $regex: new RegExp(rawTrainer.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i') } },
            { email: { $regex: new RegExp(rawTrainer.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i') } }
          ]
        });
        if (matchedTrainer) resolvedTrainerId = matchedTrainer._id;
      }
    }

    if (!resolvedTrainerId) {
      return res.status(400).json({ success: false, message: 'A valid assigned Tutor / Trainer is required before creating a batch.' });
    }

    // Validate selected eligible student IDs against resolved course
    const validStudentUserIds = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];
    if (validStudentUserIds.length > 0) {
      const valResult = await validateStudentsCourseEnrollment(validStudentUserIds, resolvedCourseId);
      if (!valResult.valid) {
        return res.status(400).json({ success: false, message: valResult.message });
      }
    }

    // Create Batch
    const batch = await Batch.create({
      name: name.trim(),
      code: normCode,
      academicYear,
      batchType: targetBatchType,
      collegeId: targetBatchType === 'COLLEGE_TRAINING' ? (collegeId || null) : null,
      department: department || 'CSE',
      courseId: resolvedCourseId,
      trainerId: resolvedTrainerId,
      mode: mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
      description: description || '',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      saturdayIncluded: Boolean(saturdayIncluded),
      sundayIncluded: Boolean(sundayIncluded),
      trainingDays: Array.isArray(trainingDays) && trainingDays.length > 0 ? trainingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: startTime || '09:00 AM',
      endTime: endTime || '04:30 PM',
      breakStartTime: breakStartTime || '01:00 PM',
      breakEndTime: breakEndTime || '02:00 PM',
      dailyReportTime: dailyReportTime || '18:00',
      holidays: Array.isArray(holidays) ? holidays : [],
      collegeGuideName: collegeGuideName || '',
      collegeGuideEmail: collegeGuideEmail || '',
      placementOfficeEmail: placementOfficeEmail || '',
      hodName: hodName || '',
      hodEmail: hodEmail || '',
      tutorResumeUrl: tutorResumeUrl || '',
      studentIds: [],
      totalStudents: 0
    });

    const romanYr = toRomanYear(academicYear); // e.g. "I", "II", "III", "IV"
    const deptPrefix = (department || 'CSE').trim().toUpperCase().replace(/[^A-Z]/g, '');

    const createdStudents = [];
    let seq = 1;

    // 1. Process new students roster if provided
    for (const st of students) {
      if (!st.email || !st.name) continue;

      const email = st.email.toLowerCase().trim();
      let user = await User.findOne({ email });

      if (user) {
        // Existing student found: mark for college training without modifying LMS data
        if (user.studentType === 'LMS') {
          user.studentType = 'BOTH';
        } else if (!user.studentType) {
          user.studentType = targetBatchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'INSTITUTE_TRAINING';
        }
        user.trainingEligible = true;
        await user.save();
      } else {
        // Calculate username format: DEPARTMENT + YEAR_ROMAN + 2_DIGIT_SEQ (e.g. CSEI01)
        let usernameCandidate = '';
        let isUsernameUnique = false;

        while (!isUsernameUnique) {
          const seqStr = String(seq).padStart(2, '0');
          usernameCandidate = `${deptPrefix}${romanYr}${seqStr}`.toLowerCase();
          const dupUser = await User.findOne({ username: usernameCandidate });
          if (!dupUser) {
            isUsernameUnique = true;
          } else {
            seq++;
          }
        }

        const initialPlainPassword = generateStudentInitialPassword(deptPrefix, seq);
        const sqStudentId = `SQ-${deptPrefix}-${String(seq).padStart(4, '0')}`;

        user = await User.create({
          name: st.name.trim(),
          username: usernameCandidate,
          studentId: sqStudentId,
          email,
          password: initialPlainPassword,
          role: 'student',
          studentType: targetBatchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'INSTITUTE_TRAINING',
          trainingEligible: true,
          mustChangePassword: true
        });

        // Also create a basic StudentProfile if needed
        let courseDomain = 'general';
        const targetCId = resolvedCourseId || courseId;
        if (targetCId) {
          const c = await Course.findById(targetCId);
          if (c) courseDomain = (c.slug || c.domain || c.category || c.title || 'general').toLowerCase().trim();
        }

        await StudentProfile.create({
          userId: user._id,
          studentId: sqStudentId,
          collegeId: targetBatchType === 'COLLEGE_TRAINING' ? collegeId : null,
          batchId: batch._id,
          enrolledCourseId: resolvedCourseId,
          assignedTutorId: resolvedTrainerId,
          department: st.department || department,
          academicYear: st.academicYear || academicYear,
          domain: courseDomain,
          learningMode: mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
          studentType: targetBatchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'LMS'
        });
      }

      // Create CollegeTrainingEnrollment if batchType === 'COLLEGE_TRAINING'
      if (targetBatchType === 'COLLEGE_TRAINING') {
        await CollegeTrainingEnrollment.findOneAndUpdate(
          { studentId: user._id, collegeTrainingBatchId: batch._id },
          {
            studentId: user._id,
            collegeTrainingBatchId: batch._id,
            collegeId,
            tutorId: resolvedTrainerId,
            courseId: resolvedCourseId,
            startDate: startDate || new Date(),
            endDate: endDate || null,
            status: 'ACTIVE'
          },
          { upsert: true, new: true }
        );
      }

      if (!batch.studentIds.includes(user._id)) {
        batch.studentIds.push(user._id);
      }

      createdStudents.push({
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        username: user.username,
        email: user.email,
        initialPassword: initialPlainPassword,
        department: st.department || department,
        academicYear: st.academicYear || academicYear
      });

      seq++;
    }

    // 2. Process existing students selected in form to merge into this batch
    if (validStudentUserIds.length > 0) {
      for (const sId of validStudentUserIds) {
        const sIdStr = sId.toString();
        if (!batch.studentIds.some(existingId => existingId.toString() === sIdStr)) {
          batch.studentIds.push(sId);
        }

        if (targetBatchType === 'COLLEGE_TRAINING') {
          const u = await User.findById(sId);
          if (u) {
            if (u.studentType === 'LMS') u.studentType = 'BOTH';
            else if (!u.studentType) u.studentType = 'COLLEGE_TRAINING';
            u.trainingEligible = true;
            await u.save();
          }

          await CollegeTrainingEnrollment.findOneAndUpdate(
            { studentId: sId, collegeTrainingBatchId: batch._id },
            {
              studentId: sId,
              collegeTrainingBatchId: batch._id,
              collegeId: collegeId || null,
              tutorId: resolvedTrainerId,
              courseId: resolvedCourseId,
              startDate: startDate ? new Date(startDate) : new Date(),
              endDate: endDate ? new Date(endDate) : null,
              status: 'ACTIVE'
            },
            { upsert: true, new: true }
          );
        }
      }

      // Update batchId, enrolledCourseId, and assignedTutorId on StudentProfiles
      await StudentProfile.updateMany(
        { userId: { $in: validStudentUserIds } },
        {
          $set: {
            batchId: batch._id,
            enrolledCourseId: resolvedCourseId,
            assignedTutorId: resolvedTrainerId
          }
        }
      );
    }

    // Update batch student count
    batch.totalStudents = batch.studentIds.length;
    await batch.save();

    // Synchronize batch tutor across trainer profile and student records
    if (resolvedTrainerId) {
      await syncBatchTutor(batch._id, resolvedTrainerId);
    }

    const populatedBatch = await Batch.findById(batch._id)
      .populate('collegeId', 'name city code')
      .populate('courseId', 'title category code')
      .populate('trainerId', 'name email phone avatar')
      .populate('studentIds', 'name studentId email username');

    return res.status(201).json({
      success: true,
      message: `Batch '${batch.name}' created successfully with ${batch.totalStudents} student(s).`,
      data: populatedBatch,
      createdStudents
    });
  } catch (error) {
    console.error('createFullBatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/batches
 * Get all batches with populated details
 */
exports.getBatches = async (req, res) => {
  try {
    const { batchType } = req.query;
    let filter = {};

    // Auto-normalize any batch with a collegeId to COLLEGE_TRAINING
    await Batch.updateMany(
      { collegeId: { $ne: null }, batchType: { $ne: 'COLLEGE_TRAINING' } },
      { $set: { batchType: 'COLLEGE_TRAINING' } }
    );

    if (batchType === 'COLLEGE_TRAINING') {
      filter = { $or: [{ batchType: 'COLLEGE_TRAINING' }, { collegeId: { $ne: null } }] };
    } else if (batchType === 'LMS') {
      filter = {
        batchType: 'LMS',
        $or: [{ collegeId: null }, { collegeId: { $exists: false } }]
      };
    }

    const batches = await Batch.find(filter)
      .populate('collegeId', 'name city code')
      .populate('courseId', 'title category code')
      .populate('trainerId', 'name email phone avatar')
      .populate('studentIds', 'name studentId email username')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/batches/:id/details
 * Detailed 8-tab batch information
 */
exports.getBatchDetails = async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId)
      .populate('collegeId', 'name city code contactEmail')
      .populate('courseId', 'title category code modules')
      .populate('trainerId', 'name email phone avatar');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Enrolled Students Roster
    // Comprehensive aggregation of students enrolled in this batch across:
    // 1. batch.studentIds (enrolled user IDs)
    // 2. CollegeTrainingEnrollment (college training enrollments for this batch)
    // 3. StudentProfile (direct batchId reference)
    const enrolledUserIdsSet = new Set();
    if (Array.isArray(batch.studentIds)) {
      batch.studentIds.forEach(id => {
        if (id) enrolledUserIdsSet.add(id.toString());
      });
    }

    const collegeEnrollments = await CollegeTrainingEnrollment.find({ collegeTrainingBatchId: batchId });
    collegeEnrollments.forEach(e => {
      if (e.studentId) enrolledUserIdsSet.add(e.studentId.toString());
    });

    const profilesWithBatch = await StudentProfile.find({ batchId });
    profilesWithBatch.forEach(p => {
      if (p.userId) enrolledUserIdsSet.add(p.userId.toString());
    });

    const userIdsArray = Array.from(enrolledUserIdsSet);

    // Fetch student user accounts
    const studentUsers = await User.find({ _id: { $in: userIdsArray } })
      .select('name username email studentId isActive createdAt');

    // Fetch student profiles for metadata (XP, department, academicYear, studentId)
    const allProfiles = await StudentProfile.find({ userId: { $in: userIdsArray } });
    const profileByUserId = new Map();
    allProfiles.forEach(p => {
      if (p.userId) profileByUserId.set(p.userId.toString(), p);
    });

    // Synchronize batchId on StudentProfiles if missing (LMS only)
    if (userIdsArray.length > 0 && batch.batchType === 'LMS') {
      await StudentProfile.updateMany(
        { userId: { $in: userIdsArray }, batchId: { $in: [null, undefined] } },
        { $set: { batchId: batch._id } }
      );
    }

    // Fetch completed tasks counts
    const taskCounts = await StudentTask.aggregate([
      { $match: { studentId: { $in: userIdsArray.map(id => new mongoose.Types.ObjectId(id)) }, status: 'COMPLETED' } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } }
    ]);
    const taskCountMap = new Map();
    taskCounts.forEach(tc => {
      taskCountMap.set(tc._id.toString(), tc.count);
    });

    // Fetch all course enrollments for students in this batch
    const batchEnrollments = await CollegeTrainingEnrollment.find({
      collegeTrainingBatchId: batch._id
    }).populate('courseId', 'title category slug');

    const enrollmentsByStudent = new Map();
    batchEnrollments.forEach(enr => {
      const sId = enr.studentId.toString();
      if (!enrollmentsByStudent.has(sId)) {
        enrollmentsByStudent.set(sId, []);
      }
      enrollmentsByStudent.get(sId).push(enr);
    });

    const students = studentUsers.map(u => {
      const sp = profileByUserId.get(u._id.toString());
      const sEnrollments = enrollmentsByStudent.get(u._id.toString()) || [];
      const activeEnr = sEnrollments.find(e => e.status === 'ACTIVE');
      const completedEnrs = sEnrollments.filter(e => e.status === 'COMPLETED');

      return {
        _id: u._id,
        studentId: u.studentId || sp?.studentId || 'N/A',
        name: u.name,
        username: u.username,
        email: u.email,
        department: sp?.department || batch.department || 'General',
        academicYear: sp?.academicYear || batch.academicYear || '1st Year',
        totalPoints: sp?.totalXp || 0,
        completedTasks: taskCountMap.get(u._id.toString()) || 0,
        isActive: u.isActive,
        activeEnrollment: activeEnr ? {
          enrollmentId: activeEnr._id,
          courseId: activeEnr.courseId?._id || activeEnr.courseId,
          courseName: activeEnr.courseId?.title || activeEnr.courseName || 'Assigned Course',
          courseUsername: activeEnr.courseUsername || u.username,
          accountStatus: activeEnr.accountStatus || 'ACTIVE',
          status: 'ACTIVE',
          startDate: activeEnr.startDate
        } : null,
        completedEnrollments: completedEnrs.map(c => ({
          enrollmentId: c._id,
          courseId: c.courseId?._id || c.courseId,
          courseName: c.courseId?.title || c.courseName || 'Completed Course',
          completionDate: c.completionDate || c.credentialsRevokedAt,
          accountStatus: c.accountStatus || 'REVOKED',
          status: 'COMPLETED'
        })),
        currentCourseName: activeEnr ? (activeEnr.courseId?.title || activeEnr.courseName) : (completedEnrs.length > 0 ? `${completedEnrs[0].courseName} (Completed)` : (batch.courseId?.title || 'None Assigned')),
        enrollmentStatus: activeEnr ? 'ACTIVE' : (completedEnrs.length > 0 ? 'COMPLETED' : 'PENDING'),
        loginAccessStatus: activeEnr && activeEnr.accountStatus === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED'
      };
    });

    // Ensure batch.totalStudents and batch.studentIds are 100% in sync
    if (batch.totalStudents !== students.length || (batch.studentIds?.length || 0) !== students.length) {
      batch.totalStudents = students.length;
      batch.studentIds = students.map(s => s._id);
      await batch.save();
    }

    // Modules & Tasks Progress calculation (optimized single aggregation for all students & modules)
    let modulesProgress = [];
    if (batch.courseId) {
      const courseModules = await Module.find({ courseId: batch.courseId._id }).sort({ order: 1 }).lean();
      const totalStudentsCount = students.length;

      if (courseModules.length > 0) {
        const moduleIds = courseModules.map(m => m._id);
        const allTasks = await DomainTask.find({ moduleId: { $in: moduleIds } }).select('_id moduleId').lean();

        const tasksByModule = new Map();
        const allTaskIds = [];
        allTasks.forEach(t => {
          const mId = t.moduleId.toString();
          if (!tasksByModule.has(mId)) tasksByModule.set(mId, []);
          tasksByModule.get(mId).push(t._id);
          allTaskIds.push(t._id);
        });

        // Single aggregation for all batch students across all module tasks
        let completedSet = new Set();
        if (totalStudentsCount > 0 && allTaskIds.length > 0) {
          const studentUserObjectIds = students.map(s => new mongoose.Types.ObjectId(s._id));
          const completedStudentTasks = await StudentTask.aggregate([
            {
              $match: {
                studentId: { $in: studentUserObjectIds },
                domainTaskId: { $in: allTaskIds },
                status: 'COMPLETED'
              }
            },
            {
              $group: {
                _id: { studentId: '$studentId', domainTaskId: '$domainTaskId' }
              }
            }
          ]);

          completedSet = new Set(
            completedStudentTasks.map(c => `${c._id.studentId.toString()}:${c._id.domainTaskId.toString()}`)
          );
        }

        for (const mod of courseModules) {
          const mId = mod._id.toString();
          const taskIds = tasksByModule.get(mId) || [];
          const totalTasksInModule = taskIds.length;

          let completedStudentsCount = 0;
          if (totalStudentsCount > 0 && totalTasksInModule > 0) {
            for (const s of students) {
              const sId = s._id.toString();
              let allTasksCompleted = true;
              for (const tId of taskIds) {
                if (!completedSet.has(`${sId}:${tId.toString()}`)) {
                  allTasksCompleted = false;
                  break;
                }
              }
              if (allTasksCompleted) completedStudentsCount++;
            }
          }

          const isModuleCompletedForBatch = totalStudentsCount > 0 && completedStudentsCount === totalStudentsCount;
          const batchProgressPercent = totalStudentsCount > 0
            ? Math.round((completedStudentsCount / totalStudentsCount) * 100)
            : 0;

          modulesProgress.push({
            moduleId: mod._id,
            title: mod.title,
            description: mod.description,
            totalTasks: totalTasksInModule,
            completedStudentsCount,
            totalStudentsCount,
            batchProgressPercent,
            isCompleted: isModuleCompletedForBatch
          });
        }
      }
    }

    // Tutor Daily Updates
    const tutorUpdates = await DailyTeachingUpdate.find({ batchId })
      .populate('tutorId', 'name email')
      .sort({ date: -1 })
      .lean();

    // Daily Reports & PDF Logs
    const dailyReports = await BatchDailyReport.find({ batchId }).sort({ date: -1 }).lean();

    // Email Logs
    const emailLogs = await EmailLog.find({ batchId }).sort({ createdAt: -1 }).lean();

    // Attendance Log (grouped by date)
    const attendanceRecords = await Attendance.find({ batchId }).populate('userId', 'name studentId').lean();
    const attendanceByDateMap = new Map();

    attendanceRecords.forEach(att => {
      if (!attendanceByDateMap.has(att.date)) {
        attendanceByDateMap.set(att.date, { date: att.date, present: 0, absent: 0, records: [] });
      }
      const entry = attendanceByDateMap.get(att.date);
      if (att.status.toUpperCase() === 'PRESENT') entry.present++;
      else entry.absent++;

      entry.records.push({
        studentId: att.userId?.studentId,
        studentName: att.userId?.name,
        status: att.status
      });
    });

    const attendanceLog = Array.from(attendanceByDateMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    return res.json({
      success: true,
      data: {
        batch,
        students,
        modulesProgress,
        tutorUpdates,
        dailyReports,
        emailLogs,
        attendanceLog
      }
    });
  } catch (error) {
    console.error('getBatchDetails error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/tutor/daily-update
 * Tutor submits daily teaching update for a batch date
 */
exports.saveTutorDailyUpdate = async (req, res) => {
  try {
    const { batchId, date, topicCovered, practicalActivity, notes, remarks } = req.body;

    if (!batchId || !topicCovered) {
      return res.status(400).json({ success: false, message: 'batchId and topicCovered are required.' });
    }

    const dateStr = date || new Date().toISOString().split('T')[0];

    const update = await DailyTeachingUpdate.findOneAndUpdate(
      { batchId, date: dateStr },
      {
        batchId,
        tutorId: req.user._id,
        date: dateStr,
        topicCovered,
        practicalActivity: practicalActivity || '',
        notes: notes || '',
        remarks: remarks || ''
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Daily teaching update saved successfully.', data: update });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/batches/:id/generate-report
 * Manually generate daily progress PDF & send email
 */
exports.generateManualReport = async (req, res) => {
  try {
    const batchId = req.params.id;
    const dateStr = req.body.date || new Date().toISOString().split('T')[0];

    const report = await generateDailyReportPDF(batchId, dateStr);
    const emailLog = await sendDailyReportEmail(report._id);

    return res.json({
      success: true,
      message: `Daily Report generated and email dispatched for ${dateStr}.`,
      data: { report, emailLog }
    });
  } catch (error) {
    console.error('generateManualReport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/batches/create
 * Admin creates a new batch & assigns existing students
 */
exports.createBatch = async (req, res) => {
  try {
    const {
      name,
      code,
      courseId,
      trainerId,
      tutorId,
      mode = 'ONLINE',
      startDate,
      endDate,
      startTime = '10:00 AM',
      endTime = '11:00 AM',
      studentIds = [],
      description = ''
    } = req.body;

    const targetBatchType = req.body.batchType || (req.body.collegeId ? 'COLLEGE_TRAINING' : 'LMS');

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch Name is required.' });
    }

    if (targetBatchType === 'COLLEGE_TRAINING' && !req.body.collegeId) {
      return res.status(400).json({ success: false, message: 'College is required for College Training batches.' });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course / Domain is required for the batch.' });
    }

    const batchCode = code ? code.trim().toUpperCase() : `BATCH-${Date.now().toString().slice(-6)}`;
    const resolvedTutorId = tutorId || trainerId || null;

    if (!resolvedTutorId) {
      return res.status(400).json({ success: false, message: 'An assigned Tutor / Trainer is required for the batch.' });
    }

    const existingCode = await Batch.findOne({ code: batchCode });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Batch code '${batchCode}' already exists.` });
    }

    const validStudentUserIds = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];

    // Validate course enrollment for all selected students
    if (validStudentUserIds.length > 0) {
      const valResult = await validateStudentsCourseEnrollment(validStudentUserIds, courseId);
      if (!valResult.valid) {
        return res.status(400).json({ success: false, message: valResult.message });
      }
    }

    const batch = await Batch.create({
      name: name.trim(),
      code: batchCode,
      batchType: targetBatchType,
      collegeId: targetBatchType === 'COLLEGE_TRAINING' ? (req.body.collegeId || null) : null,
      courseId: courseId || null,
      trainerId: resolvedTutorId,
      mode: mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      startTime,
      endTime,
      description: description || '',
      studentIds: validStudentUserIds,
      totalStudents: validStudentUserIds.length,
      status: 'active'
    });

    if (validStudentUserIds.length > 0) {
      if (targetBatchType === 'COLLEGE_TRAINING') {
        for (const sId of validStudentUserIds) {
          const u = await User.findById(sId);
          if (u) {
            if (u.studentType === 'LMS') u.studentType = 'BOTH';
            else if (!u.studentType) u.studentType = 'COLLEGE_TRAINING';
            u.trainingEligible = true;
            await u.save();
          }

          await CollegeTrainingEnrollment.findOneAndUpdate(
            { studentId: sId, collegeTrainingBatchId: batch._id },
            {
              studentId: sId,
              collegeTrainingBatchId: batch._id,
              tutorId: resolvedTutorId,
              courseId: courseId || null,
              startDate: startDate ? new Date(startDate) : new Date(),
              endDate: endDate ? new Date(endDate) : null,
              status: 'ACTIVE'
            },
            { upsert: true, new: true }
          );
        }
      }

      await StudentProfile.updateMany(
        { userId: { $in: validStudentUserIds } },
        {
          $set: {
            batchId: batch._id,
            enrolledCourseId: courseId,
            assignedTutorId: resolvedTutorId
          }
        }
      );
    }

    if (resolvedTutorId) {
      await syncBatchTutor(batch._id, resolvedTutorId);
    }

    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'title category')
      .populate('trainerId', 'name email phone avatar')
      .populate('studentIds', 'name studentId email username');

    return res.status(201).json({
      success: true,
      message: `Batch '${batch.name}' created successfully with ${validStudentUserIds.length} student(s).`,
      data: populatedBatch
    });
  } catch (error) {
    console.error('createBatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/batches/:id
 * Admin updates batch details & student assignments
 */
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      department,
      academicYear,
      collegeId,
      courseId,
      trainerId,
      tutorId,
      mode,
      startDate,
      endDate,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      trainingDays,
      saturdayIncluded,
      sundayIncluded,
      collegeGuideName,
      collegeGuideEmail,
      hodName,
      hodEmail,
      placementOfficeEmail,
      dailyReportTime,
      tutorResumeUrl,
      studentIds,
      description
    } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    if (name) batch.name = name.trim();
    if (code) batch.code = code.trim().toUpperCase();
    if (department) batch.department = department.trim();
    if (academicYear) batch.academicYear = academicYear;
    if (collegeId) batch.collegeId = collegeId;
    if (courseId !== undefined) batch.courseId = courseId || null;
    
    // Check if trainer/tutor changed
    const oldTrainerId = batch.trainerId ? batch.trainerId.toString() : null;
    const newTrainerId = (tutorId || trainerId) ? (tutorId || trainerId).toString() : null;
    let tutorChanged = false;
    if (newTrainerId && oldTrainerId !== newTrainerId) {
      batch.trainerId = newTrainerId;
      tutorChanged = true;
    }

    if (mode) batch.mode = mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate !== undefined) batch.endDate = endDate ? new Date(endDate) : null;
    if (startTime) batch.startTime = startTime;
    if (endTime) batch.endTime = endTime;
    if (breakStartTime !== undefined) batch.breakStartTime = breakStartTime;
    if (breakEndTime !== undefined) batch.breakEndTime = breakEndTime;
    if (trainingDays && Array.isArray(trainingDays)) batch.trainingDays = trainingDays;
    if (saturdayIncluded !== undefined) batch.saturdayIncluded = Boolean(saturdayIncluded);
    if (sundayIncluded !== undefined) batch.sundayIncluded = Boolean(sundayIncluded);
    if (collegeGuideName !== undefined) batch.collegeGuideName = collegeGuideName;
    if (collegeGuideEmail !== undefined) batch.collegeGuideEmail = collegeGuideEmail;
    if (hodName !== undefined) batch.hodName = hodName;
    if (hodEmail !== undefined) batch.hodEmail = hodEmail;
    if (placementOfficeEmail !== undefined) batch.placementOfficeEmail = placementOfficeEmail;
    if (dailyReportTime !== undefined) batch.dailyReportTime = dailyReportTime;
    if (tutorResumeUrl !== undefined) batch.tutorResumeUrl = tutorResumeUrl;
    if (description !== undefined) batch.description = description;

    if (studentIds && Array.isArray(studentIds)) {
      const newStudentUserIds = studentIds.filter(Boolean);
      const effectiveCourseId = (courseId !== undefined ? courseId : batch.courseId);

      // Validate course enrollment for any students being assigned
      if (effectiveCourseId && newStudentUserIds.length > 0) {
        const valResult = await validateStudentsCourseEnrollment(newStudentUserIds, effectiveCourseId);
        if (!valResult.valid) {
          return res.status(400).json({ success: false, message: valResult.message });
        }
      }

      const oldStudentUserIds = (batch.studentIds || []).map(sId => sId.toString());
      const removedUserIds = oldStudentUserIds.filter(sId => !newStudentUserIds.includes(sId));
      if (removedUserIds.length > 0) {
        await StudentProfile.updateMany(
          { userId: { $in: removedUserIds }, batchId: batch._id },
          { $unset: { batchId: 1 } }
        );
        await CollegeTrainingEnrollment.deleteMany({
          studentId: { $in: removedUserIds },
          collegeTrainingBatchId: batch._id
        });
      }

      if (newStudentUserIds.length > 0) {
        await StudentProfile.updateMany(
          { userId: { $in: newStudentUserIds } },
          { $set: { batchId: batch._id, enrolledCourseId: effectiveCourseId, assignedTutorId: batch.trainerId } }
        );
      }

      batch.studentIds = newStudentUserIds;
      batch.totalStudents = newStudentUserIds.length;
    }

    await batch.save();

    // If tutor was changed, synchronize batch across TrainerProfile, StudentProfile, Sessions, and Enrollments
    if (tutorChanged) {
      await syncBatchTutor(batch._id, batch.trainerId, oldTrainerId);
    }

    const updateSessionObj = {};
    if (batch.trainerId) updateSessionObj.tutorId = batch.trainerId;
    if (batch.courseId) updateSessionObj.courseId = batch.courseId;
    if (batch.mode) updateSessionObj.sessionType = batch.mode;
    if (batch.studentIds) updateSessionObj.studentIds = batch.studentIds;

    if (Object.keys(updateSessionObj).length > 0) {
      await Session.updateMany(
        { batchId: batch._id, status: { $ne: 'COMPLETED' } },
        { $set: updateSessionObj }
      );
    }

    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'title category')
      .populate('trainerId', 'name email phone avatar')
      .populate('studentIds', 'name studentId email username');

    return res.json({
      success: true,
      message: `Batch '${batch.name}' updated successfully.`,
      data: populatedBatch
    });
  } catch (error) {
    console.error('updateBatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/batches/:id/students/:studentUserId
 * Unassign student from batch without deleting student account
 */
exports.removeStudentFromBatch = async (req, res) => {
  try {
    const { id, studentUserId } = req.params;
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    batch.studentIds = (batch.studentIds || []).filter(sId => sId.toString() !== studentUserId);
    batch.totalStudents = batch.studentIds.length;
    await batch.save();

    await CollegeTrainingEnrollment.deleteMany({
      studentId: studentUserId,
      collegeTrainingBatchId: id
    });

    await StudentProfile.updateOne(
      { userId: studentUserId, batchId: id },
      { $unset: { batchId: 1 } }
    );

    return res.json({
      success: true,
      message: 'Student removed from batch successfully (student profile preserved).'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/batches/schedule-days
 * Day-by-Day Online/Offline Class Scheduler for a Batch
 */
exports.createBatchSchedules = async (req, res) => {
  try {
    const {
      batchId,
      schedules = []
    } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one class schedule entry is required.' });
    }

    let batch = null;
    if (batchId) {
      batch = await Batch.findById(batchId);
    }

    const createdSessions = [];

    for (const item of schedules) {
      const {
        scheduledDate,
        title,
        startTime = '10:00 AM',
        endTime = '11:00 AM',
        meetingLink,
        classroom,
        tutorId,
        studentIds,
        sessionType
      } = item;

      if (!scheduledDate || !title) continue;

      const targetBatchId = batchId || item.batchId || null;
      const targetTutorId = tutorId || (batch ? batch.trainerId : null);
      const targetCourseId = batch ? batch.courseId : (item.courseId || null);
      const targetType = sessionType || (batch ? batch.mode : 'ONLINE');
      const targetStudentIds = (studentIds && studentIds.length > 0) ? studentIds : (batch ? batch.studentIds : []);

      if (!targetTutorId || !targetCourseId) {
        return res.status(400).json({
          success: false,
          message: `Course and Tutor are required for schedule on ${scheduledDate}.`
        });
      }

      const scheduledStartDateTime = new Date(`${scheduledDate} ${startTime}`);
      const scheduledEndDateTime = new Date(`${scheduledDate} ${endTime}`);
      const sessionId = `CLS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const initialAttendance = (targetStudentIds || []).map(sId => ({
        studentId: sId,
        status: 'PENDING'
      }));

      const session = await Session.create({
        sessionId,
        courseId: targetCourseId,
        batchId: targetBatchId,
        tutorId: targetTutorId,
        studentIds: targetStudentIds,
        title: title.trim(),
        topic: title.trim(),
        scheduledDate,
        startTime,
        endTime,
        scheduledStartDateTime: isNaN(scheduledStartDateTime.getTime()) ? new Date() : scheduledStartDateTime,
        scheduledEndDateTime: isNaN(scheduledEndDateTime.getTime()) ? new Date(Date.now() + 3600000) : scheduledEndDateTime,
        sessionType: targetType,
        meetingLink: (meetingLink || 'https://meet.google.com/cq-live-class').trim(),
        classroom: (classroom || '').trim(),
        status: 'UPCOMING',
        attendance: initialAttendance,
        reminderSent: false
      });

      createdSessions.push(session);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully scheduled ${createdSessions.length} class session(s).`,
      data: createdSessions
    });
  } catch (error) {
    console.error('createBatchSchedules error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/batches/eligible-students
 * Fetch students for College Training batch selection
 */
exports.getCollegeTrainingEligibleStudents = async (req, res) => {
  try {
    const { courseId, domain, search, batchId } = req.query;

    let targetCourse = null;
    if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        targetCourse = await Course.findById(courseId);
      }
      if (!targetCourse) {
        targetCourse = await Course.findOne({
          $or: [
            { slug: courseId.toString().toLowerCase() },
            { title: new RegExp(`^${courseId.toString().trim()}$`, 'i') }
          ]
        });
      }
    }

    // Build filter for StudentProfile
    let profileFilter = {};

    if (targetCourse) {
      const courseSlug = (targetCourse.slug || '').toLowerCase();
      profileFilter.$or = [
        { enrolledCourseId: targetCourse._id },
        ...(courseSlug ? [{ domain: courseSlug }] : [])
      ];
    } else if (domain) {
      profileFilter.domain = domain.toLowerCase();
    }

    // Query StudentProfiles with populated User and Course
    const profiles = await StudentProfile.find(profileFilter)
      .populate('userId', 'name email username studentId studentType trainingEligible isActive createdAt')
      .populate('enrolledCourseId', 'title slug category code')
      .populate('batchId', 'name code batchType')
      .populate('assignedTutorId', 'name email');

    let eligibleList = [];
    for (const p of profiles) {
      if (!p.userId) continue;

      const user = p.userId;
      const studentName = user.name || 'Student';
      const studentEmail = user.email || '';
      const studentUsername = user.username || '';
      const studentId = p.studentId || user.studentId || 'N/A';
      const courseTitle = p.enrolledCourseId?.title || (p.domain ? p.domain.toUpperCase() : 'Unassigned Course');
      const hasBatch = Boolean(p.batchId);
      const isCurrentBatch = Boolean(batchId && p.batchId?._id?.toString() === batchId.toString());

      // Search filter if provided
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matches = studentName.toLowerCase().includes(q) ||
          studentEmail.toLowerCase().includes(q) ||
          studentUsername.toLowerCase().includes(q) ||
          studentId.toLowerCase().includes(q) ||
          courseTitle.toLowerCase().includes(q);
        if (!matches) continue;
      }

      eligibleList.push({
        _id: user._id,
        profileId: p._id,
        name: studentName,
        email: studentEmail,
        username: studentUsername,
        studentId: studentId,
        studentType: user.studentType || p.studentType || 'LMS',
        trainingEligible: user.trainingEligible || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
        enrolledCourse: courseTitle,
        enrolledCourseId: p.enrolledCourseId?._id || null,
        domain: p.domain || p.enrolledCourseId?.slug || '',
        batchId: p.batchId?._id || null,
        batchName: p.batchId?.name || null,
        batchCode: p.batchId?.code || null,
        hasBatch: hasBatch,
        isIndividual: !hasBatch,
        isCurrentBatch: isCurrentBatch,
        assignedTutorId: p.assignedTutorId?._id || null,
        assignedTutorName: p.assignedTutorId?.name || null,
        totalXp: p.totalXp || 0,
        createdAt: user.createdAt
      });
    }

    // Sort by name
    eligibleList.sort((a, b) => a.name.localeCompare(b.name));

    return res.json({
      success: true,
      course: targetCourse ? { _id: targetCourse._id, title: targetCourse.title, slug: targetCourse.slug } : null,
      totalCount: eligibleList.length,
      data: eligibleList
    });
  } catch (error) {
    console.error('getCollegeTrainingEligibleStudents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/batches/:id/preview-pdf
 * Parse PDF/Text and generate a preview showing total, new, existing in DB, already in batch, and invalid.
 */
exports.previewPdfStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    let text = '';
    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      const data = await safePdfParse(buffer);
      text = data.text;
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    } else if (req.body.rawText) {
      text = req.body.rawText;
    } else {
      return res.status(400).json({ success: false, message: 'No file or raw text uploaded.' });
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const existingBatchUserIds = new Set((batch.studentIds || []).map(s => s.toString()));
    const preview = [];
    const seenEmailsInFile = new Set();

    let newCount = 0;
    let existingDbCount = 0;
    let alreadyInBatchCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const foundEmails = line.match(emailRegex);

      if (!foundEmails || foundEmails.length === 0) {
        invalidCount++;
        continue;
      }

      const email = foundEmails[0].toLowerCase().trim();
      const parts = line.replace(email, '').split(/[,|\t;]+/);
      let name = parts[0] ? parts[0].replace(/[^a-zA-Z\s.]/g, '').trim() : '';
      if (!name || name.length < 2) {
        name = `Student ${preview.length + 1}`;
      }

      let dept = batch.department || 'CSE';
      if (/CSE|Computer/i.test(line)) dept = 'CSE';
      else if (/IT|Information/i.test(line)) dept = 'IT';
      else if (/ECE|Electronics/i.test(line)) dept = 'ECE';
      else if (/AIDS|AI|Data/i.test(line)) dept = 'AIDS';
      else if (/MECH|Mechanical/i.test(line)) dept = 'MECH';

      let year = batch.academicYear || '1st Year';
      if (/4th|Fourth|IV/i.test(line)) year = '4th Year';
      else if (/3rd|Third|III/i.test(line)) year = '3rd Year';
      else if (/2nd|Second|II/i.test(line)) year = '2nd Year';

      if (seenEmailsInFile.has(email)) {
        invalidCount++;
        continue;
      }
      seenEmailsInFile.add(email);

      const existingUser = await User.findOne({ email });
      let statusTag = 'NEW';
      let userId = null;

      if (existingUser) {
        userId = existingUser._id.toString();
        if (existingBatchUserIds.has(userId)) {
          statusTag = 'ALREADY_IN_BATCH';
          alreadyInBatchCount++;
        } else {
          statusTag = 'EXISTS_IN_DB';
          existingDbCount++;
        }
      } else {
        newCount++;
      }

      preview.push({
        name,
        email,
        department: dept,
        academicYear: year,
        statusTag,
        userId
      });
    }

    return res.json({
      success: true,
      data: {
        totalFound: preview.length,
        newStudentsCount: newCount,
        existingDbCount,
        alreadyInBatchCount,
        invalidCount,
        preview
      }
    });
  } catch (error) {
    console.error('previewPdfStudents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/batches/:id/append-students
 * Appends new or existing students into an existing College Training Batch without replacing current students!
 */
exports.appendStudentsToBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedExistingUserIds = [], newStudentsToCreate = [] } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const currentStudentUserIds = new Set((batch.studentIds || []).map(sId => sId.toString()));
    const addedStudentIds = [];

    // Validate course enrollment for all selected existing students
    if (selectedExistingUserIds && selectedExistingUserIds.length > 0 && batch.courseId) {
      const valResult = await validateStudentsCourseEnrollment(selectedExistingUserIds, batch.courseId);
      if (!valResult.valid) {
        return res.status(400).json({ success: false, message: valResult.message });
      }
    }

    // 1. Process existing users
    for (const userId of selectedExistingUserIds) {
      if (!userId) continue;
      const uIdStr = userId.toString();
      if (currentStudentUserIds.has(uIdStr)) continue;

      const user = await User.findById(userId);
      if (user) {
        if (user.studentType === 'LMS') user.studentType = 'BOTH';
        else if (!user.studentType) user.studentType = batch.batchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'INSTITUTE_TRAINING';
        user.trainingEligible = true;
        await user.save();

        if (batch.batchType === 'COLLEGE_TRAINING') {
          await CollegeTrainingEnrollment.findOneAndUpdate(
            { studentId: user._id, collegeTrainingBatchId: batch._id },
            {
              studentId: user._id,
              collegeTrainingBatchId: batch._id,
              collegeId: batch.collegeId || null,
              tutorId: batch.trainerId || null,
              courseId: batch.courseId || null,
              startDate: batch.startDate || new Date(),
              endDate: batch.endDate || null,
              status: 'ACTIVE'
            },
            { upsert: true, new: true }
          );
        }

        // Link student profile to batch, course, and tutor
        await StudentProfile.updateOne(
          { userId: user._id },
          {
            $set: {
              batchId: batch._id,
              enrolledCourseId: batch.courseId || undefined,
              assignedTutorId: batch.trainerId || undefined
            }
          }
        );

        currentStudentUserIds.add(uIdStr);
        addedStudentIds.push(user._id);
      }
    }

    // 2. Process genuinely new student accounts to create
    const romanYr = toRomanYear(batch.academicYear || '1st Year');
    const deptPrefix = (batch.department || 'CSE').trim().toUpperCase().replace(/[^A-Z]/g, '');
    let seq = currentStudentUserIds.size + 1;

    for (const st of newStudentsToCreate) {
      if (!st.email || !st.name) continue;
      const email = st.email.toLowerCase().trim();

      let user = await User.findOne({ email });

      if (user) {
        const uIdStr = user._id.toString();
        if (!currentStudentUserIds.has(uIdStr)) {
          if (user.studentType === 'LMS') user.studentType = 'BOTH';
          else if (!user.studentType) user.studentType = batch.batchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'INSTITUTE_TRAINING';
          user.trainingEligible = true;
          await user.save();

          if (batch.batchType === 'COLLEGE_TRAINING') {
            await CollegeTrainingEnrollment.findOneAndUpdate(
              { studentId: user._id, collegeTrainingBatchId: batch._id },
              {
                studentId: user._id,
                collegeTrainingBatchId: batch._id,
                collegeId: batch.collegeId || null,
                tutorId: batch.trainerId || null,
                courseId: batch.courseId || null,
                startDate: batch.startDate || new Date(),
                endDate: batch.endDate || null,
                status: 'ACTIVE'
              },
              { upsert: true, new: true }
            );
          }
          currentStudentUserIds.add(uIdStr);
          addedStudentIds.push(user._id);
        }
        continue;
      }

      // Generate credentials for new user
      let usernameCandidate = '';
      let isUsernameUnique = false;
      while (!isUsernameUnique) {
        const seqStr = String(seq).padStart(2, '0');
        usernameCandidate = `${deptPrefix}${romanYr}${seqStr}`.toLowerCase();
        const dupUser = await User.findOne({ username: usernameCandidate });
        if (!dupUser) isUsernameUnique = true;
        else seq++;
      }

      const initialPlainPassword = generateStudentInitialPassword(deptPrefix, seq);
      const sqStudentId = `SQ-${deptPrefix}-${String(seq).padStart(4, '0')}`;

      user = await User.create({
        name: st.name.trim(),
        username: usernameCandidate,
        studentId: sqStudentId,
        email,
        password: initialPlainPassword,
        role: 'student',
        studentType: batch.batchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'INSTITUTE_TRAINING',
        trainingEligible: true,
        mustChangePassword: true
      });

      await StudentProfile.create({
        userId: user._id,
        studentId: sqStudentId,
        collegeId: batch.collegeId || null,
        batchId: batch.batchType === 'LMS' ? batch._id : null,
        enrolledCourseId: batch.courseId || null,
        assignedTutorId: batch.trainerId || null,
        department: st.department || batch.department,
        academicYear: st.academicYear || batch.academicYear,
        learningMode: 'ONLINE',
        studentType: batch.batchType === 'COLLEGE_TRAINING' ? 'COLLEGE_TRAINING' : 'LMS'
      });

      if (batch.batchType === 'COLLEGE_TRAINING') {
        await CollegeTrainingEnrollment.findOneAndUpdate(
          { studentId: user._id, collegeTrainingBatchId: batch._id },
          {
            studentId: user._id,
            collegeTrainingBatchId: batch._id,
            collegeId: batch.collegeId || null,
            tutorId: batch.trainerId || null,
            courseId: batch.courseId || null,
            startDate: batch.startDate || new Date(),
            endDate: batch.endDate || null,
            status: 'ACTIVE'
          },
          { upsert: true, new: true }
        );
      }

      currentStudentUserIds.add(user._id.toString());
      addedStudentIds.push(user._id);
      seq++;
    }

    batch.studentIds = Array.from(currentStudentUserIds);
    batch.totalStudents = batch.studentIds.length;
    await batch.save();

    if (batch.trainerId) {
      await syncBatchTutor(batch._id, batch.trainerId);
    }

    return res.json({
      success: true,
      message: `Successfully added ${addedStudentIds.length} student(s) to batch '${batch.name}'. Total enrolled: ${batch.totalStudents}.`,
      data: {
        totalStudents: batch.totalStudents,
        addedCount: addedStudentIds.length
      }
    });
  } catch (error) {
    console.error('appendStudentsToBatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/batches/:id
 * Safe delete of a College Training / LMS Batch without deleting student user accounts
 */
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found or already deleted.' });
    }

    const batchName = batch.name;
    const batchCode = batch.code;

    // Remove batch-specific enrollments, daily updates, daily reports, attendance, sessions
    await Promise.allSettled([
      CollegeTrainingEnrollment.deleteMany({ collegeTrainingBatchId: id }),
      BatchDailyReport.deleteMany({ batchId: id }),
      DailyTeachingUpdate.deleteMany({ batchId: id }),
      Attendance.deleteMany({ batchId: id }),
      Session.deleteMany({ batchId: id }),
      TrainerProfile.updateMany({ assignedBatches: id }, { $pull: { assignedBatches: id } }),
      // Unset batchId on StudentProfile (without deleting StudentProfile or User account!)
      StudentProfile.updateMany({ batchId: id }, { $unset: { batchId: 1 } })
    ]);

    // Delete batch document
    await Batch.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Batch '${batchName}' (${batchCode}) deleted successfully. All student accounts have been preserved.`
    });
  } catch (error) {
    console.error('deleteBatch error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while deleting batch.' });
  }
};

/**
 * POST /api/admin/batches/:id/assign-course
 * Reassign or assign a new course to existing college batch students
 */
exports.assignCourseToBatchStudents = async (req, res) => {
  try {
    const lifecycleService = require('../services/courseEnrollmentLifecycleService');
    const batchId = req.params.id;
    const {
      courseId,
      collegeId,
      tutorId,
      studentUserIds,
      mode,
      startDate,
      endDate,
      sendEmails
    } = req.body;

    const result = await lifecycleService.assignCourseToBatchStudents({
      batchId,
      courseId,
      collegeId,
      tutorId,
      studentUserIds,
      mode,
      startDate,
      endDate,
      sendEmails: sendEmails !== false,
      req
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('assignCourseToBatchStudents error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to assign course to batch students.' });
  }
};

/**
 * POST /api/admin/batches/:id/complete-course
 * Mark an entire course completed for the batch and deactivate credentials
 */
exports.markBatchCourseCompleted = async (req, res) => {
  try {
    const lifecycleService = require('../services/courseEnrollmentLifecycleService');
    const batchId = req.params.id;
    const { courseId, completionReason } = req.body;

    const result = await lifecycleService.markBatchCourseCompleted({
      batchId,
      courseId,
      completionReason: completionReason || 'Course officially marked COMPLETED by admin',
      req
    });

    return res.json(result);
  } catch (error) {
    console.error('markBatchCourseCompleted error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to complete batch course.' });
  }
};

/**
 * POST /api/admin/batches/:id/enrollments/:enrollmentId/complete
 * Mark individual student course enrollment completed and deactivate credentials
 */
exports.markIndividualCourseCompleted = async (req, res) => {
  try {
    const lifecycleService = require('../services/courseEnrollmentLifecycleService');
    const { enrollmentId } = req.params;
    const { completionReason, tutorRemarks } = req.body;

    const result = await lifecycleService.markCourseCompleted({
      enrollmentId,
      completionReason: completionReason || 'Course officially completed for student',
      tutorRemarks,
      req
    });

    return res.json(result);
  } catch (error) {
    console.error('markIndividualCourseCompleted error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to complete student course enrollment.' });
  }
};

/**
 * GET /api/admin/batches/:id/lifecycle-students
 * Retrieve batch students with course lifecycle & login access status
 */
exports.getBatchStudentsLifecycle = async (req, res) => {
  try {
    const lifecycleService = require('../services/courseEnrollmentLifecycleService');
    const batchId = req.params.id;

    const data = await lifecycleService.getBatchStudentsLifecycle(batchId);
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getBatchStudentsLifecycle error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch student lifecycle records.' });
  }
};


