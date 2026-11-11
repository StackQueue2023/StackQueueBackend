const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CollegeTrainingEnrollment = require('../models/CollegeTrainingEnrollment');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Batch = require('../models/Batch');
const College = require('../models/College');
const Course = require('../models/Course');
const { sendCourseEnrollmentCredentialsEmail } = require('./emailService');
const { captureError } = require('./errorAlertService');

/**
 * Helper to generate a unique course-specific username
 */
async function generateUniqueCourseUsername(baseName, courseSlug) {
  const cleanBase = (baseName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSlug = (courseSlug || 'crs').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
  
  let candidate = `${cleanBase}_${cleanSlug}`;
  let existing = await CollegeTrainingEnrollment.findOne({ courseUsername: candidate });
  if (!existing) return candidate;

  let counter = 1;
  while (existing) {
    candidate = `${cleanBase}_${cleanSlug}${counter}`;
    existing = await CollegeTrainingEnrollment.findOne({ courseUsername: candidate });
    counter++;
  }
  return candidate;
}

/**
 * Helper to generate a clean, secure temporary password
 */
function generateCourseTempPassword(courseTitle) {
  const prefix = (courseTitle || 'Pass').replace(/[^a-zA-Z]/g, '').slice(0, 4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}@${randomNum}`;
}

/**
 * 1. Assign a New Course to Existing College Batch Students
 */
exports.assignCourseToBatchStudents = async ({
  collegeId,
  batchId,
  courseId,
  tutorId,
  studentUserIds = [],
  mode = 'ONLINE',
  startDate,
  endDate,
  sendEmails = true
}) => {
  if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
    throw new Error('Valid Batch ID is required.');
  }
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Valid Course ID is required.');
  }

  const batch = await Batch.findById(batchId);
  if (!batch) throw new Error('Selected batch not found.');

  const course = await Course.findById(courseId);
  if (!course) throw new Error('Selected course not found.');

  const resolvedCollegeId = collegeId || batch.collegeId;
  const college = resolvedCollegeId ? await College.findById(resolvedCollegeId) : null;
  const resolvedTutorId = tutorId || batch.trainerId;
  const tutor = resolvedTutorId ? await User.findById(resolvedTutorId) : null;

  const validStudentIds = Array.isArray(studentUserIds)
    ? studentUserIds.filter(id => id && mongoose.Types.ObjectId.isValid(id))
    : [];

  if (validStudentIds.length === 0) {
    throw new Error('Please select at least one student from the batch.');
  }

  const assignedResults = [];
  const errors = [];

  for (const sId of validStudentIds) {
    try {
      const user = await User.findById(sId);
      if (!user) {
        errors.push(`Student with ID ${sId} not found.`);
        continue;
      }

      const profile = await StudentProfile.findOne({ userId: user._id });
      const permanentStudentId = user.studentId || profile?.studentId || `SQ-${(user.name || 'ST').slice(0, 3).toUpperCase()}-${String(user._id).slice(-4).toUpperCase()}`;

      // Check if student already has an enrollment for this exact course in this batch
      let enrollment = await CollegeTrainingEnrollment.findOne({
        studentId: user._id,
        collegeTrainingBatchId: batch._id,
        courseId: course._id
      }).select('+coursePassword');

      // Generate credentials
      const courseUsername = enrollment?.courseUsername || await generateUniqueCourseUsername(user.username || user.name, course.slug || course.title);
      const plainTempPassword = generateCourseTempPassword(course.title);
      const hashedPassword = await bcrypt.hash(plainTempPassword, 10);

      if (enrollment) {
        // Re-activate or update existing enrollment
        enrollment.status = 'ACTIVE';
        enrollment.accountStatus = 'ACTIVE';
        enrollment.courseUsername = courseUsername;
        enrollment.coursePassword = hashedPassword;
        enrollment.tokenVersion = (enrollment.tokenVersion || 1) + 1;
        enrollment.credentialsCreatedAt = new Date();
        enrollment.credentialsRevokedAt = null;
        enrollment.revocationReason = '';
        enrollment.startDate = startDate ? new Date(startDate) : (enrollment.startDate || new Date());
        enrollment.endDate = endDate ? new Date(endDate) : enrollment.endDate;
        enrollment.tutorId = resolvedTutorId;
        enrollment.mode = mode || batch.mode || 'ONLINE';
        await enrollment.save();
      } else {
        // Create brand-new course enrollment
        enrollment = await CollegeTrainingEnrollment.create({
          studentId: user._id,
          permanentStudentId,
          collegeTrainingBatchId: batch._id,
          collegeId: resolvedCollegeId,
          collegeName: college ? college.name : '',
          batchName: batch.name,
          courseId: course._id,
          courseName: course.title,
          tutorId: resolvedTutorId,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          mode: mode || batch.mode || 'ONLINE',
          status: 'ACTIVE',
          courseUsername,
          coursePassword: hashedPassword,
          accountStatus: 'ACTIVE',
          tokenVersion: 1,
          credentialsCreatedAt: new Date(),
          credentialsRevokedAt: null
        });
      }

      // Update student profile with active course without duplicating profile
      if (profile) {
        profile.enrolledCourseId = course._id;
        profile.domain = course.category ? course.category.toLowerCase() : 'software development';
        profile.assignedTutorId = resolvedTutorId;
        await profile.save();
      }

      // Add to batch student list if not already present
      if (!batch.studentIds.some(existingId => existingId.toString() === user._id.toString())) {
        batch.studentIds.push(user._id);
      }

      // Send credentials securely via email
      if (sendEmails && user.email) {
        sendCourseEnrollmentCredentialsEmail({
          toEmail: user.email,
          studentName: user.name,
          studentId: permanentStudentId,
          courseName: course.title,
          batchName: batch.name,
          collegeName: college ? college.name : '',
          tutorName: tutor ? tutor.name : '',
          username: courseUsername,
          password: plainTempPassword,
          startDate: enrollment.startDate,
          mode: enrollment.mode
        }).catch(err => {
          console.error(`[Lifecycle Email Error] Could not send to ${user.email}:`, err.message);
        });
      }

      assignedResults.push({
        enrollmentId: enrollment._id,
        studentId: user._id,
        permanentStudentId,
        studentName: user.name,
        studentEmail: user.email,
        courseName: course.title,
        courseUsername,
        temporaryPassword: plainTempPassword,
        status: 'ACTIVE',
        accountStatus: 'ACTIVE'
      });
    } catch (studentErr) {
      console.error(`Error enrolling student ${sId}:`, studentErr);
      errors.push(`Student ID ${sId}: ${studentErr.message}`);
    }
  }

  // Update batch total count
  batch.totalStudents = batch.studentIds.length;
  await batch.save();

  return {
    success: true,
    message: `Successfully assigned course "${course.title}" to ${assignedResults.length} student(s).`,
    totalAssigned: assignedResults.length,
    assignedStudents: assignedResults,
    errors: errors.length > 0 ? errors : null
  };
};

/**
 * 2. Automatically Deactivate Login After Course Completion (Transactional & Idempotent)
 */
exports.markCourseCompleted = async ({
  enrollmentId,
  studentId,
  batchId,
  courseId,
  completionReason = 'Course officially completed',
  tutorRemarks = ''
}) => {
  let query = {};
  if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId)) {
    query._id = enrollmentId;
  } else if (studentId && batchId && courseId) {
    query = {
      studentId: new mongoose.Types.ObjectId(studentId),
      collegeTrainingBatchId: new mongoose.Types.ObjectId(batchId),
      courseId: new mongoose.Types.ObjectId(courseId)
    };
  } else if (studentId && courseId) {
    query = {
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId)
    };
  } else {
    throw new Error('Valid enrollment ID or studentId + courseId combination is required.');
  }

  const enrollment = await CollegeTrainingEnrollment.findOne(query).select('+coursePassword');
  if (!enrollment) {
    throw new Error('Course enrollment not found.');
  }

  // Idempotent: If already completed and credentials revoked, return clean confirmation
  if (enrollment.status === 'COMPLETED' && enrollment.accountStatus === 'REVOKED') {
    return {
      success: true,
      alreadyCompleted: true,
      message: `Course enrollment for "${enrollment.courseName}" is already marked COMPLETED and access is deactivated.`,
      enrollment
    };
  }

  const completionTimestamp = new Date();

  // 1. Invalidate enrollment credentials immediately
  enrollment.status = 'COMPLETED';
  enrollment.completionDate = completionTimestamp;
  enrollment.accountStatus = 'REVOKED';
  enrollment.credentialsRevokedAt = completionTimestamp;
  enrollment.revocationReason = completionReason;
  enrollment.coursePassword = undefined; // permanently removes hashed password from DB
  enrollment.tokenVersion = (enrollment.tokenVersion || 1) + 1; // instantly invalidates any issued JWT token!

  if (tutorRemarks) {
    enrollment.feedback = (enrollment.feedback ? `${enrollment.feedback}\n` : '') + `Completion Remarks: ${tutorRemarks}`;
  }
  await enrollment.save();

  // 2. Preserve historical record in StudentProfile without deleting permanent profile
  const profile = await StudentProfile.findOne({ userId: enrollment.studentId });
  if (profile) {
    const course = await Course.findById(enrollment.courseId);
    
    // Add to previousCourses if not already recorded
    const alreadyLogged = profile.previousCourses?.some(
      pc => pc.courseId && pc.courseId.toString() === enrollment.courseId.toString()
    );

    if (!alreadyLogged) {
      if (!profile.previousCourses) profile.previousCourses = [];
      profile.previousCourses.push({
        courseId: enrollment.courseId,
        domain: course?.category ? course.category.toLowerCase() : 'completed',
        completedAt: completionTimestamp,
        finalPoints: enrollment.points || 0,
        finalProgress: 100
      });
    }

    // Check if the student has OTHER active course enrollments
    const otherActiveEnrollment = await CollegeTrainingEnrollment.findOne({
      studentId: enrollment.studentId,
      _id: { $ne: enrollment._id },
      status: 'ACTIVE',
      accountStatus: 'ACTIVE'
    }).populate('courseId');

    if (otherActiveEnrollment && otherActiveEnrollment.courseId) {
      // Seamlessly switch active learning view to the remaining active course!
      profile.enrolledCourseId = otherActiveEnrollment.courseId._id;
      profile.domain = otherActiveEnrollment.courseId.category ? otherActiveEnrollment.courseId.category.toLowerCase() : 'active';
      profile.assignedTutorId = otherActiveEnrollment.tutorId;
    } else {
      // No other active courses: clear current enrolled course so completed course cannot be played
      profile.enrolledCourseId = null;
    }

    await profile.save();
  }

  return {
    success: true,
    message: `Course "${enrollment.courseName || 'Training'}" marked COMPLETED. Login access immediately deactivated.`,
    enrollmentId: enrollment._id,
    studentId: enrollment.studentId,
    completionDate: completionTimestamp,
    accountStatus: 'REVOKED',
    status: 'COMPLETED'
  };
};

/**
 * 3. Batch Course Completion (Mark all students in a batch completed for a course)
 */
exports.markBatchCourseCompleted = async ({
  batchId,
  courseId,
  completionReason = 'Batch officially completed course',
  req
}) => {
  if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
    throw new Error('Valid Batch ID is required.');
  }

  const query = { collegeTrainingBatchId: batchId };
  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    query.courseId = courseId;
  }

  const enrollments = await CollegeTrainingEnrollment.find(query);
  if (enrollments.length === 0) {
    return { success: true, count: 0, message: 'No enrollments found for this batch/course.' };
  }

  const results = [];
  const errors = [];

  for (const enr of enrollments) {
    try {
      const res = await exports.markCourseCompleted({
        enrollmentId: enr._id,
        completionReason,
        req
      });
      results.push(res);
    } catch (err) {
      errors.push(`Enrollment ${enr._id}: ${err.message}`);
    }
  }

  // Update Batch status to completed if all courses done
  const remainingActive = await CollegeTrainingEnrollment.countDocuments({
    collegeTrainingBatchId: batchId,
    status: 'ACTIVE'
  });

  if (remainingActive === 0) {
    await Batch.findByIdAndUpdate(batchId, { status: 'completed' });
  }

  return {
    success: true,
    totalCompleted: results.length,
    remainingActive,
    message: `Successfully marked ${results.length} student course enrollment(s) as COMPLETED and revoked login access.`,
    errors: errors.length > 0 ? errors : null
  };
};

/**
 * 4. Fetch All Batch Students with Full Course Lifecycle & Login Status
 */
exports.getBatchStudentsLifecycle = async (batchId) => {
  if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
    throw new Error('Valid Batch ID is required.');
  }

  const batch = await Batch.findById(batchId)
    .populate('collegeId', 'name city')
    .populate('trainerId', 'name email phone avatar')
    .populate('courseId', 'title category slug');

  if (!batch) throw new Error('Batch not found.');

  // Find all enrollments for this batch (both ACTIVE and COMPLETED)
  const enrollments = await CollegeTrainingEnrollment.find({
    collegeTrainingBatchId: batch._id
  })
    .populate('courseId', 'title category slug durationText')
    .populate('tutorId', 'name email')
    .sort({ createdAt: -1 });

  // Map enrollments by studentId
  const enrollmentsByStudent = new Map();
  enrollments.forEach(enr => {
    const sId = enr.studentId.toString();
    if (!enrollmentsByStudent.has(sId)) {
      enrollmentsByStudent.set(sId, []);
    }
    enrollmentsByStudent.get(sId).push(enr);
  });

  // Get all user accounts associated with this batch
  const studentUserIds = Array.from(new Set([
    ...batch.studentIds.map(id => id.toString()),
    ...enrollments.map(e => e.studentId.toString())
  ]));

  const users = await User.find({ _id: { $in: studentUserIds } })
    .select('name username email studentId isActive createdAt');

  const profiles = await StudentProfile.find({ userId: { $in: studentUserIds } })
    .populate('previousCourses.courseId', 'title category');

  const profileMap = new Map();
  profiles.forEach(p => profileMap.set(p.userId.toString(), p));

  const studentsList = users.map(user => {
    const p = profileMap.get(user._id.toString());
    const studentEnrollments = enrollmentsByStudent.get(user._id.toString()) || [];

    const activeEnrollments = studentEnrollments
      .filter(e => e.status === 'ACTIVE')
      .map(e => ({
        enrollmentId: e._id,
        courseId: e.courseId?._id || e.courseId,
        courseName: e.courseId?.title || e.courseName || 'Course',
        courseSlug: e.courseId?.slug || '',
        category: e.courseId?.category || '',
        courseUsername: e.courseUsername || user.username,
        accountStatus: e.accountStatus || 'ACTIVE',
        startDate: e.startDate,
        mode: e.mode,
        points: e.points || 0
      }));

    const completedEnrollments = studentEnrollments
      .filter(e => e.status === 'COMPLETED')
      .map(e => ({
        enrollmentId: e._id,
        courseId: e.courseId?._id || e.courseId,
        courseName: e.courseId?.title || e.courseName || 'Course',
        completionDate: e.completionDate || e.credentialsRevokedAt,
        credentialsRevokedAt: e.credentialsRevokedAt,
        revocationReason: e.revocationReason,
        accountStatus: e.accountStatus || 'REVOKED',
        points: e.points || 0,
        attendanceCount: e.attendance?.length || 0
      }));

    return {
      userId: user._id,
      name: user.name,
      permanentStudentId: user.studentId || p?.studentId || 'N/A',
      email: user.email,
      primaryUsername: user.username,
      department: p?.department || batch.department || 'General',
      academicYear: p?.academicYear || batch.academicYear || '1st Year',
      totalXp: p?.totalXp || 0,
      activeEnrollments,
      completedEnrollments,
      currentStatus: activeEnrollments.length > 0 ? 'ACTIVE_LEARNER' : completedEnrollments.length > 0 ? 'COURSE_COMPLETED' : 'ENROLLED'
    };
  });

  // Get all catalog courses for easy reassignment
  const availableCourses = await Course.find({ isActive: true })
    .select('title category durationText level slug')
    .sort({ title: 1 });

  return {
    batch: {
      _id: batch._id,
      name: batch.name,
      code: batch.code,
      college: batch.collegeId,
      department: batch.department,
      academicYear: batch.academicYear,
      mode: batch.mode,
      status: batch.status,
      assignedCourse: batch.courseId,
      assignedTrainer: batch.trainerId
    },
    students: studentsList,
    totalStudents: studentsList.length,
    activeLearnersCount: studentsList.filter(s => s.activeEnrollments.length > 0).length,
    completedLearnersCount: studentsList.filter(s => s.activeEnrollments.length === 0 && s.completedEnrollments.length > 0).length,
    availableCourses
  };
};
