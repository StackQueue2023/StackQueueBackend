const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const Challenge = require('../models/Challenge');
const Badge = require('../models/Badge');
const College = require('../models/College');
const Batch = require('../models/Batch');
const Attempt = require('../models/Attempt');
const Session = require('../models/Session');
const StudentTask = require('../models/StudentTask');
const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Offer = require('../models/Offer');
const { logAction } = require('../services/auditLogger');
const notificationService = require('../services/notificationService');

// Helper to fetch Command Center active admissions & ongoing college trainings
const getCommandCenterRealData = async () => {
  const now = new Date();

  // Run all 5 queries in parallel with .lean() and projections
  const [collegeBatches, activeCourses, lmsBatches, lmsProfiles, activeOffers] = await Promise.all([
    Batch.find({
      batchType: 'COLLEGE_TRAINING',
      status: 'active'
    })
      .select('name code collegeId courseId trainerId department academicYear studentIds totalStudents mode startDate endDate status')
      .populate('collegeId', 'name city code address')
      .populate('courseId', 'title category code')
      .populate('trainerId', 'name email phone avatar')
      .sort({ startDate: -1 })
      .lean(),
    Course.find({ isActive: { $ne: false } }).select('title category level durationText durationWeeks slug createdAt').sort({ title: 1 }).lean(),
    Batch.find({ batchType: 'LMS', status: { $in: ['active', 'upcoming'] } }).select('name code courseId mode startDate endDate').lean(),
    StudentProfile.find({ studentType: { $in: ['LMS', 'BOTH'] } }).select('enrolledCourseId').lean(),
    Offer.find({
      isActive: true,
      isDraft: false,
      $or: [
        { endDate: { $gte: now } },
        { endDate: null },
        { endDate: { $exists: false } }
      ]
    }).select('title discountValue discountType couponCode applicableCourses endDate').lean()
  ]);

  const ongoingCollegeTrainings = collegeBatches.filter(b => {
    if (b.status !== 'active') return false;
    const hasStarted = !b.startDate || new Date(b.startDate) <= now;
    const notEnded = !b.endDate || new Date(b.endDate) >= now;
    return hasStarted && notEnded;
  }).map(b => ({
    _id: b._id,
    name: b.name,
    code: b.code,
    collegeName: b.collegeId?.name || 'Partner College',
    collegeCity: b.collegeId?.city || '',
    collegeCode: b.collegeId?.code || '',
    trainingName: b.courseId?.title || b.department || 'College Training Program',
    courseCategory: b.courseId?.category || '',
    department: b.department || 'CSE',
    academicYear: b.academicYear || '1st Year',
    tutorName: b.trainerId?.name || 'Assigned Tutor',
    tutorEmail: b.trainerId?.email || '',
    startDate: b.startDate,
    endDate: b.endDate,
    status: 'Ongoing',
    totalStudents: (b.studentIds || []).length || b.totalStudents || 0,
    mode: b.mode || 'OFFLINE'
  }));

  const activeAdmissions = activeCourses.map(course => {
    const enrolledCount = lmsProfiles.filter(p => p.enrolledCourseId?.toString() === course._id.toString()).length;
    const courseBatch = lmsBatches.find(b => b.courseId?.toString() === course._id.toString());
    const promo = activeOffers.find(o => (!o.applicableCourses || o.applicableCourses.length === 0 || o.applicableCourses.some(ac => ac.toString() === course._id.toString())));

    return {
      _id: course._id,
      courseName: course.title,
      domain: course.category || 'General Technology',
      level: course.level || 'All Levels',
      durationText: course.durationText || (course.durationWeeks ? `${course.durationWeeks} Weeks` : '3 Months'),
      availableBatch: courseBatch ? `${courseBatch.name} (${courseBatch.code})` : 'Direct LMS Admission',
      mode: courseBatch?.mode || 'Online & Offline',
      startDate: courseBatch?.startDate || course.createdAt,
      deadline: courseBatch?.endDate || promo?.endDate || null,
      status: 'Active Admission',
      enrolledCount,
      promoCampaign: promo ? {
        title: promo.title,
        discount: promo.discountValue ? `${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '₹'} OFF` : null,
        couponCode: promo.couponCode
      } : null
    };
  });

  return { ongoingCollegeTrainings, activeAdmissions, activeOffers };
};

// GET /api/admin/command-center
exports.getCommandCenterData = async (req, res) => {
  try {
    const { ongoingCollegeTrainings, activeAdmissions } = await getCommandCenterRealData();
    return res.json({
      success: true,
      data: {
        ongoingCollegeTrainings,
        activeAdmissions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    // Run real-time data fetch and all count queries concurrently
    const [
      commandCenterData,
      totalStudents,
      totalTrainers,
      totalColleges,
      totalBatches,
      totalChallenges,
      totalAttempts,
      passedAttempts,
      attemptsByGame,
      batches
    ] = await Promise.all([
      getCommandCenterRealData(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['trainer', 'tutor'] } }),
      College.countDocuments(),
      Batch.countDocuments(),
      Challenge.countDocuments(),
      Attempt.countDocuments(),
      Attempt.countDocuments({ passed: true }),
      Attempt.aggregate([
        { $group: { _id: '$gameSlug', count: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      Batch.find().select('name code batchType collegeId courseId status totalStudents').populate('collegeId', 'name').populate('courseId', 'title').lean()
    ]);

    const { ongoingCollegeTrainings, activeAdmissions } = commandCenterData;

    return res.json({
      success: true,
      data: {
        totalStudents,
        totalTrainers,
        totalColleges,
        totalBatches,
        totalChallenges,
        totalAttempts,
        overallAccuracy: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 100,
        attemptsByGame,
        batches,
        ongoingCollegeTrainings,
        activeAdmissions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role === 'trainer' || role === 'tutor') {
      filter.role = { $in: ['trainer', 'tutor'] };
    } else if (role) {
      filter.role = role;
    }
    const users = await User.find(filter)
      .select('-password -resetPasswordOtp -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const { checkDuplicate, registerQuestion } = require('../services/questionRegistryService');

// POST /api/admin/challenges (Dynamic Challenge Creator)
exports.createChallenge = async (req, res) => {
  try {
    const {
      title,
      gameSlug,
      levelNumber = 1,
      category,
      difficulty = 'Beginner',
      type,
      language = 'javascript',
      runtime = 'Node.js',
      evaluationType = 'output_test_cases',
      instructions,
      targetDescription,
      starterCode = '',
      targetCondition = {},
      expectedOutput = '',
      testCases = [],
      mcqOptions = [],
      hints = [],
      xpReward = 25,
      timeLimitSeconds = 120
    } = req.body;

    if (!title || !gameSlug || !category || !type || !instructions) {
      return res.status(400).json({ success: false, message: 'Required challenge fields missing.' });
    }

    // Check duplicate
    const dupCheck = await checkDuplicate(title, instructions || targetDescription, category, gameSlug);
    if (dupCheck.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Duplicate Question Error: This question already exists in ${dupCheck.existingSource} ("${dupCheck.existingTitle}").`
      });
    }

    const challenge = await Challenge.create({
      title,
      gameSlug,
      levelNumber,
      category,
      difficulty,
      type,
      language,
      runtime,
      evaluationType,
      instructions,
      targetDescription,
      starterCode,
      targetCondition,
      expectedOutput,
      testCases,
      mcqOptions,
      hints,
      xpReward,
      timeLimitSeconds
    });

    await registerQuestion(challenge._id, 'GAME_HUB', title, instructions || targetDescription, category, gameSlug);

    return res.status(201).json({ success: true, data: challenge });
  } catch (error) {
    console.error('createChallenge error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/challenges
exports.getChallenges = async (req, res) => {
  try {
    const { gameSlug } = req.query;
    const filter = gameSlug ? { gameSlug } : {};
    const challenges = await Challenge.find(filter).sort({ gameSlug: 1, levelNumber: 1, order: 1 });
    return res.json({ success: true, data: challenges });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/challenges/:id
exports.deleteChallenge = async (req, res) => {
  try {
    await Challenge.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Challenge deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/batches
exports.createBatch = async (req, res) => {
  try {
    const { name, code, collegeId, courseId, trainerId, startDate, endDate } = req.body;
    const batch = await Batch.create({
      name,
      code,
      collegeId,
      courseId,
      trainerId,
      startDate: startDate || new Date(),
      endDate
    });
    return res.status(201).json({ success: true, data: batch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to deduplicate college records in database
const deduplicateColleges = async () => {
  try {
    const allColleges = await College.find().sort({ createdAt: 1 });
    const seenNorm = new Map();
    const seenCode = new Map();
    const duplicateIds = [];
    const reassignments = new Map();

    for (const col of allColleges) {
      if (!col.name) continue;
      const normKey = col.name && col.city ? `${col.name.trim().toLowerCase()}|${col.city.trim().toLowerCase()}` : null;
      const codeKey = col.code && col.code.trim() ? col.code.trim().toUpperCase() : null;

      const primary = (normKey && seenNorm.has(normKey) ? seenNorm.get(normKey) : null) ||
                      (codeKey && seenCode.has(codeKey) ? seenCode.get(codeKey) : null);

      if (primary && primary._id.toString() !== col._id.toString()) {
        duplicateIds.push(col._id);
        reassignments.set(col._id.toString(), primary._id);
      } else {
        if (normKey && !seenNorm.has(normKey)) seenNorm.set(normKey, col);
        if (codeKey && !seenCode.has(codeKey)) seenCode.set(codeKey, col);
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`[Deduplicator] Found ${duplicateIds.length} duplicate college records. Re-assigning references and removing duplicates...`);

      for (const [dupIdStr, primaryId] of reassignments.entries()) {
        await Batch.updateMany({ collegeId: dupIdStr }, { collegeId: primaryId });
        await TrainerProfile.updateMany({ assignedColleges: dupIdStr }, { $addToSet: { assignedColleges: primaryId } });
        await TrainerProfile.updateMany({ assignedColleges: dupIdStr }, { $pull: { assignedColleges: dupIdStr } });
        if (DailyReport) await DailyReport.updateMany({ collegeId: dupIdStr }, { collegeId: primaryId });
        if (Attendance) await Attendance.updateMany({ collegeId: dupIdStr }, { collegeId: primaryId });
      }

      await College.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`[Deduplicator] Successfully removed ${duplicateIds.length} duplicate college entries from database.`);
    }
  } catch (err) {
    console.error('Error deduplicating colleges:', err);
  }
};

exports.deduplicateColleges = deduplicateColleges;

// GET /api/admin/colleges
exports.getColleges = async (req, res) => {
  try {
    await deduplicateColleges();
    const colleges = await College.find().sort({ createdAt: -1 });

    const StudentProfile = require('../models/StudentProfile');
    
    const enrichedColleges = await Promise.all(
      colleges.map(async (col) => {
        const colObj = col.toObject();
        
        const batches = await Batch.find({ collegeId: col._id }).populate('courseId', 'title name domain');
        colObj.batchesCount = batches.length;
        
        const studentCountFromProfile = await StudentProfile.countDocuments({ collegeId: col._id });
        const batchStudentIds = new Set();
        batches.forEach(b => {
          (b.studentIds || []).forEach(sId => batchStudentIds.add(sId.toString()));
        });
        colObj.studentsCount = Math.max(studentCountFromProfile, batchStudentIds.size);
        
        const courseSet = new Set();
        batches.forEach(b => {
          if (b.courseId && (b.courseId.title || b.courseId.name || b.courseId.domain)) {
            courseSet.add(b.courseId.title || b.courseId.name || b.courseId.domain);
          } else if (b.department) {
            courseSet.add(b.department);
          }
        });
        colObj.assignedCourses = Array.from(courseSet);
        
        return colObj;
      })
    );

    return res.json({ success: true, data: enrichedColleges });
  } catch (error) {
    console.error('getColleges error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/colleges
exports.createCollege = async (req, res) => {
  try {
    const { name, code, city, address, contactPerson, contactEmail, contactPhone, isActive, departments } = req.body;
    const normName = (name || '').trim();
    const normCode = (code || '').trim().toUpperCase();
    const normCity = (city || '').trim();

    if (!normName || !normCode || !normCity) {
      return res.status(400).json({ success: false, message: 'Institution Name, Campus Code, and City/Location are required.' });
    }

    await deduplicateColleges();

    const existingCode = await College.findOne({
      code: { $regex: new RegExp(`^${normCode.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `A college campus with code '${normCode}' already exists.`
      });
    }

    const college = await College.create({
      name: normName,
      code: normCode,
      city: normCity,
      address: (address || '').trim(),
      contactPerson: (contactPerson || '').trim(),
      contactEmail: (contactEmail || '').trim(),
      contactPhone: (contactPhone || '').trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      departments: departments || []
    });

    return res.status(201).json({ success: true, data: college });
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
      return res.status(400).json({
        success: false,
        message: `College Code '${req.body.code}' already exists. Please enter a unique college code.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/colleges/:id
exports.updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, city, address, contactPerson, contactEmail, contactPhone, isActive, departments } = req.body;

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'Partner college not found.' });
    }

    if (name) college.name = name.trim();
    if (city) college.city = city.trim();
    if (address !== undefined) college.address = address.trim();
    if (contactPerson !== undefined) college.contactPerson = contactPerson.trim();
    if (contactEmail !== undefined) college.contactEmail = contactEmail.trim();
    if (contactPhone !== undefined) college.contactPhone = contactPhone.trim();
    if (isActive !== undefined) college.isActive = Boolean(isActive);
    if (departments) college.departments = departments;

    if (code && code.trim().toUpperCase() !== college.code) {
      const normCode = code.trim().toUpperCase();
      const existingCode = await College.findOne({
        _id: { $ne: id },
        code: { $regex: new RegExp(`^${normCode.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: `A college campus with code '${normCode}' already exists.`
        });
      }
      college.code = normCode;
    }

    await college.save();

    return res.json({
      success: true,
      message: 'College details updated successfully.',
      data: college
    });
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
      return res.status(400).json({
        success: false,
        message: `College Code '${req.body.code}' already exists. Please enter a unique college code.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/colleges/:id
exports.deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const StudentProfile = require('../models/StudentProfile');

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'Partner college not found.' });
    }

    const batchCount = await Batch.countDocuments({ collegeId: id });
    const studentCount = await StudentProfile.countDocuments({ collegeId: id });

    if ((batchCount > 0 || studentCount > 0) && force !== 'true') {
      return res.status(400).json({
        success: false,
        hasDependentRecords: true,
        batchCount,
        studentCount,
        message: `Cannot delete '${college.name}'. It currently has ${batchCount} active training batch(es) and ${studentCount} assigned student(s). Reassign or remove dependent records first.`
      });
    }

    await Batch.updateMany({ collegeId: id }, { $unset: { collegeId: "" } });
    await StudentProfile.updateMany({ collegeId: id }, { $unset: { collegeId: "" } });
    await TrainerProfile.updateMany({ assignedColleges: id }, { $pull: { assignedColleges: id } });

    await College.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Partner college deleted successfully.'
    });
  } catch (error) {
    console.error('deleteCollege error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/badges
exports.createBadge = async (req, res) => {
  try {
    const { name, slug, description, category, icon, color, criteria, xpBonus } = req.body;
    const badge = await Badge.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      category,
      icon,
      color,
      criteria,
      xpBonus,
      isCustom: true
    });
    return res.status(201).json({ success: true, data: badge });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/live-monitor
exports.getLiveMonitor = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const sessions = await Session.find({ scheduledDate: todayStr })
      .populate('tutorId', 'name email avatar')
      .populate('courseId', 'title')
      .populate('batchId', 'name code')
      .populate('studentIds', 'name email avatar')
      .sort({ scheduledStartDateTime: 1 });

    const now = new Date();
    let stats = {
      total: sessions.length,
      upcoming: 0,
      live: 0,
      completed: 0,
      delayed: 0,
      missed: 0
    };

    const enrichedSessions = sessions.map(s => {
      const dynamicStatus = s.computeCurrentStatus(10);
      let delayMinutes = 0;
      if (dynamicStatus === 'DELAYED' || (dynamicStatus === 'LIVE' && s.actualStartTime && s.scheduledStartDateTime)) {
        const startDiff = (s.actualStartTime ? s.actualStartTime.getTime() : now.getTime()) - s.scheduledStartDateTime.getTime();
        delayMinutes = Math.max(0, Math.round(startDiff / (1000 * 60)));
      } else if (dynamicStatus === 'MISSED') {
        const diff = now.getTime() - s.scheduledEndDateTime.getTime();
        delayMinutes = Math.max(0, Math.round(diff / (1000 * 60)));
      }

      if (dynamicStatus === 'LIVE') stats.live++;
      else if (dynamicStatus === 'DELAYED') stats.delayed++;
      else if (dynamicStatus === 'COMPLETED') stats.completed++;
      else if (dynamicStatus === 'MISSED') stats.missed++;
      else stats.upcoming++;

      return {
        ...s.toObject(),
        dynamicStatus,
        delayMinutes
      };
    });

    return res.json({
      success: true,
      data: {
        date: todayStr,
        stats,
        sessions: enrichedSessions
      }
    });
  } catch (error) {
    console.error('getLiveMonitor error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/assign-tutor
exports.assignTutorToStudent = async (req, res) => {
  try {
    const { studentId, tutorId } = req.body;
    if (!studentId || !tutorId) {
      return res.status(400).json({ success: false, message: 'studentId and tutorId are required.' });
    }

    const tutor = await User.findOne({ _id: tutorId, role: { $in: ['tutor', 'trainer'] } });
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found.' });
    }

    // Update StudentProfile
    const studentProfile = await StudentProfile.findOneAndUpdate(
      { userId: studentId },
      { assignedTutorId: tutorId },
      { new: true, upsert: true }
    );

    // Update TrainerProfile
    await TrainerProfile.findOneAndUpdate(
      { userId: tutorId },
      { $addToSet: { assignedStudents: studentId } },
      { upsert: true }
    );

    await logAction(req.user._id, 'ASSIGN_TUTOR', 'StudentProfile', studentProfile._id, { studentId, tutorId });

    return res.json({
      success: true,
      message: 'Tutor assigned to student successfully.',
      data: { studentProfile }
    });
  } catch (error) {
    console.error('assignTutorToStudent error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/session-reports
exports.getSessionReports = async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const completedSessions = await Session.countDocuments({ status: 'COMPLETED' });
    const liveSessions = await Session.countDocuments({ status: 'LIVE' });
    const tasksAssigned = await StudentTask.countDocuments();
    const tasksCompleted = await StudentTask.countDocuments({ status: 'COMPLETED' });

    // Recent sessions
    const recentSessions = await Session.find()
      .sort({ scheduledDate: -1, startTime: -1 })
      .limit(15)
      .populate('tutorId', 'name email')
      .populate('courseId', 'title')
      .populate('batchId', 'name');

    return res.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        liveSessions,
        tasksAssigned,
        tasksCompleted,
        recentSessions
      }
    });
  } catch (error) {
    console.error('getSessionReports error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Utility: Generate SQ-DOMAIN-NUMBER student ID
// Called when admin creates a student
// ─────────────────────────────────────────────
const DOMAIN_CODE_MAP = {
  java: 'JA',
  python: 'PY',
  cpp: 'CPP',
  react: 'RE'
};

exports.generateSQStudentId = async (domain) => {
  const code = DOMAIN_CODE_MAP[domain?.toLowerCase()] || 'GEN';
  const prefix = `SQ-${code}-`;
  // Count existing IDs with this prefix to get next number
  const existing = await User.countDocuments({
    studentId: { $regex: `^${prefix}`, $options: 'i' }
  });
  const nextNum = String(existing + 1).padStart(4, '0');
  return `${prefix}${nextNum}`;
};

// POST /api/admin/students/generate-id
exports.generateStudentId = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ success: false, message: 'domain is required.' });
    const studentId = await exports.generateSQStudentId(domain);
    return res.json({ success: true, studentId });
  } catch (error) {
    console.error('generateStudentId error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// LIVE CLASS MEETING ASSIGNMENT CONTROLLER FUNCTIONS
// ─────────────────────────────────────────────────────────

// GET /api/admin/live-class/students
// Fetches existing students from DB with populated Course and Tutor for Live Class selection
exports.getLiveClassEligibleStudents = async (req, res) => {
  try {
    const studentProfiles = await StudentProfile.find()
      .populate('userId', 'name email username studentId phone avatar isActive')
      .populate('enrolledCourseId', 'title slug level durationWeeks')
      .populate('assignedTutorId', 'name email avatar')
      .sort({ createdAt: -1 });

    const formatted = studentProfiles.map(p => {
      const u = p.userId || {};
      const c = p.enrolledCourseId || null;
      const t = p.assignedTutorId || null;
      const sId = p.studentId || u.studentId || `STU-${(p._id || '').toString().slice(-4).toUpperCase()}`;

      return {
        profileId: p._id,
        studentUserId: u._id,
        studentId: sId,
        studentName: u.name || 'Unknown Student',
        studentEmail: u.email || '',
        course: c ? { _id: c._id, title: c.title, slug: c.slug } : null,
        tutor: t ? { _id: t._id, name: t.name, email: t.email } : null,
        hasCourseAndTutor: Boolean(c && t)
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getLiveClassEligibleStudents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/live-class/assign
// Admin assigns Live Class meeting to selected existing student
exports.assignLiveClassMeeting = async (req, res) => {
  try {
    const {
      studentUserId,
      title,
      scheduledDate,
      startTime,
      endTime,
      meetingLink,
      description = ''
    } = req.body;

    // 1. Mandatory Field Validations
    if (!studentUserId) {
      return res.status(400).json({ success: false, message: 'Student selection is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting title is required.' });
    }
    if (!scheduledDate) {
      return res.status(400).json({ success: false, message: 'Meeting date is required.' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Start time and End time are required.' });
    }
    if (!meetingLink || !meetingLink.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting link is required.' });
    }

    // 2. Validate Meeting URL format
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(meetingLink.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid meeting URL format. URL must start with http:// or https://' });
    }

    // 3. Find existing student profile from DB to fetch assigned Course and Tutor
    const profile = await StudentProfile.findOne({ userId: studentUserId })
      .populate('enrolledCourseId', 'title')
      .populate('assignedTutorId', 'name email');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found in database.' });
    }

    if (!profile.enrolledCourseId || !profile.assignedTutorId) {
      return res.status(400).json({
        success: false,
        message: 'Selected student has no assigned course or tutor. Please assign a course and tutor to the student profile first.'
      });
    }

    // 4. Prevent duplicate assignment for same student, date, and startTime
    const duplicate = await Session.findOne({
      studentIds: studentUserId,
      scheduledDate,
      startTime: startTime.trim(),
      status: { $ne: 'CANCELLED' }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A live class ("${duplicate.title}") is already assigned to this student on ${scheduledDate} at ${startTime}.`
      });
    }

    // 5. Parse Start and End DateTimes
    const startDt = new Date(`${scheduledDate} ${startTime}`);
    const endDt = new Date(`${scheduledDate} ${endTime}`);
    const validStartDt = isNaN(startDt.getTime()) ? new Date() : startDt;
    const validEndDt = isNaN(endDt.getTime()) ? new Date(validStartDt.getTime() + 60 * 60 * 1000) : endDt;

    const sessionId = `SES-${Date.now().toString().slice(-6)}`;

    // 6. Create Session referencing existing Student User ID, Course ID, and Tutor ID
    const session = await Session.create({
      sessionId,
      courseId: profile.enrolledCourseId._id,
      tutorId: profile.assignedTutorId._id,
      studentIds: [studentUserId],
      title: title.trim(),
      topic: title.trim(),
      description: description ? description.trim() : '',
      scheduledDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      scheduledStartDateTime: validStartDt,
      scheduledEndDateTime: validEndDt,
      meetingLink: meetingLink.trim(),
      status: 'UPCOMING',
      sessionType: 'ONLINE'
    });

    // Notify student
    await notificationService.createInAppNotification(
      studentUserId,
      `New Live Class Assigned: ${title.trim()}`,
      `A new live class has been scheduled for ${scheduledDate} from ${startTime} to ${endTime}.`,
      'live_class',
      meetingLink.trim()
    );

    await logAction(req.user._id, 'ASSIGN_LIVE_CLASS', 'Session', session._id, {
      sessionId,
      studentUserId,
      title: title.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Live class assigned to student successfully.',
      data: session
    });
  } catch (error) {
    console.error('assignLiveClassMeeting error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/live-class/:id
exports.deleteLiveClassMeeting = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Live class meeting not found.' });
    }
    return res.json({ success: true, message: 'Live class deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

