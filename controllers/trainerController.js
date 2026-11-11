const TrainerProfile = require('../models/TrainerProfile');
const StudentProfile = require('../models/StudentProfile');
const Attempt = require('../models/Attempt');
const TrainerFeedback = require('../models/TrainerFeedback');
const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const Module = require('../models/Module');
const StudentModuleStatus = require('../models/StudentModuleStatus');

// GET /api/trainer/dashboard
exports.getTrainerDashboard = async (req, res) => {
  try {
    const trainerUserId = req.user._id;
    const trainerProfile = await TrainerProfile.findOne({ userId: trainerUserId })
      .populate('assignedColleges')
      .populate('assignedBatches');

    const batchIds = trainerProfile ? trainerProfile.assignedBatches.map(b => b._id) : [];

    // Students in trainer's batches
    const studentProfiles = await StudentProfile.find({ batchId: { $in: batchIds } })
      .populate('userId', 'name email avatar')
      .populate('batchId', 'name code')
      .populate('enrolledCourseId', 'title');

    const studentUserIds = studentProfiles.map(sp => sp.userId._id);

    // Recent attempts across assigned students
    const recentAttempts = await Attempt.find({ studentId: { $in: studentUserIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'name avatar')
      .populate('challengeId', 'title gameSlug difficulty');

    // Failed challenges needing trainer review
    const failedAttempts = await Attempt.find({
      studentId: { $in: studentUserIds },
      passed: false
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('studentId', 'name email')
      .populate('challengeId', 'title gameSlug');

    // Top performers and students needing support
    const sortedByXp = [...studentProfiles].sort((a, b) => b.totalXp - a.totalXp);
    const topPerformers = sortedByXp.slice(0, 5);
    const studentsNeedingHelp = studentProfiles.filter(sp => sp.stats.accuracyRate < 80 || sp.stats.challengesSolved < 5);

    // Today's attendance summary
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({
      batchId: { $in: batchIds },
      date: todayStr
    });

    return res.json({
      success: true,
      data: {
        trainerProfile,
        totalAssignedStudents: studentProfiles.length,
        activeBatchesCount: batchIds.length,
        topPerformers,
        studentsNeedingHelp,
        recentAttempts,
        failedAttempts,
        todayAttendanceCount: {
          marked: todayAttendance.length,
          present: todayAttendance.filter(a => a.status === 'Present').length,
          absent: todayAttendance.filter(a => a.status === 'Absent').length
        }
      }
    });
  } catch (error) {
    console.error('trainerDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/trainer/students
exports.getAssignedStudents = async (req, res) => {
  try {
    const trainerUserId = req.user._id;

    // 1. Batches where this user is assigned as trainer
    const tutorBatches = await Batch.find({ trainerId: trainerUserId })
      .populate('courseId', 'title slug category code')
      .populate('collegeId', 'name city code')
      .sort({ createdAt: -1 });

    let tutorBatchIds = tutorBatches.map(b => b._id);

    // Also include any batches assigned in TrainerProfile
    const trainerProfile = await TrainerProfile.findOne({ userId: trainerUserId });
    if (trainerProfile?.assignedBatches) {
      for (const bId of trainerProfile.assignedBatches) {
        if (!tutorBatchIds.some(id => id.toString() === bId.toString())) {
          tutorBatchIds.push(bId);
        }
      }
    }

    // 2. Query students:
    // a) Belong to one of this tutor's batches, OR
    // b) Assigned directly to this tutor and have NO batch (individual students).
    // Note: If a student belongs to another tutor's batch, they are strictly excluded!
    const query = {
      $or: [
        { batchId: { $in: tutorBatchIds } },
        {
          assignedTutorId: trainerUserId,
          $or: [{ batchId: null }, { batchId: { $exists: false } }]
        }
      ]
    };

    let students = await StudentProfile.find(query)
      .populate('userId', 'name email username avatar isActive studentId phone')
      .populate('batchId', 'name code batchType department academicYear courseId')
      .populate('collegeId', 'name city code')
      .populate('enrolledCourseId', 'title slug category code')
      .populate('assignedTutorId', 'name email')
      .sort({ createdAt: -1 });

    // 3. Compute module / syllabus progress for each student
    const enrichedStudents = await Promise.all(students.map(async (st) => {
      const studentObj = st.toObject();
      const courseId = st.enrolledCourseId?._id;
      let totalModules = 0;
      let completedModules = 0;
      let processingModules = 0;
      let currentModuleName = 'Not Started';

      if (courseId) {
        const modules = await Module.find({ courseId }).sort({ order: 1 });
        totalModules = modules.length;

        if (totalModules > 0) {
          const modIds = modules.map(m => m._id);
          const statuses = await StudentModuleStatus.find({
            studentId: st.userId?._id || st.userId,
            moduleId: { $in: modIds }
          });

          const statusByModId = new Map(statuses.map(s => [s.moduleId.toString(), s.status]));

          for (const m of modules) {
            const s = statusByModId.get(m._id.toString()) || (m.order === 1 ? 'processing' : 'not_started');
            if (s === 'completed') {
              completedModules++;
            } else if (s === 'processing') {
              processingModules++;
              if (currentModuleName === 'Not Started') {
                currentModuleName = m.title;
              }
            }
          }

          if (currentModuleName === 'Not Started' && modules.length > 0) {
            currentModuleName = modules[0].title;
          }
        }
      }

      const progressPercent = totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

      const hasBatch = Boolean(st.batchId && st.batchId.name);
      return {
        ...studentObj,
        hasBatch,
        isIndividual: !hasBatch,
        actualBatchName: hasBatch ? st.batchId.name : null,
        actualBatchCode: hasBatch ? st.batchId.code : null,
        assignedTutorName: st.assignedTutorId?.name || req.user.name || 'Tutor',
        courseTitle: st.enrolledCourseId?.title || (st.domain ? st.domain.toUpperCase() : 'General'),
        progress: {
          totalModules,
          completedModules,
          processingModules,
          progressPercent,
          currentModuleName
        }
      };
    }));

    // 4. Group batches with their enrolled students
    const batchesData = tutorBatches.map(b => {
      const bStudents = enrichedStudents.filter(s => s.batchId?._id?.toString() === b._id.toString());
      return {
        _id: b._id,
        name: b.name,
        code: b.code,
        batchType: b.batchType,
        department: b.department,
        academicYear: b.academicYear,
        course: b.courseId,
        college: b.collegeId,
        studentCount: bStudents.length,
        students: bStudents
      };
    });

    const individualStudents = enrichedStudents.filter(s => !s.hasBatch);

    return res.json({
      success: true,
      data: enrichedStudents,
      batches: batchesData,
      individualStudents,
      totalCount: enrichedStudents.length
    });
  } catch (error) {
    console.error('getAssignedStudents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/trainer/feedback
exports.addFeedback = async (req, res) => {
  try {
    const { studentId, targetType = 'general_performance', referenceId, title, comments, rating = 5, actionItems = [] } = req.body;
    if (!studentId || !title || !comments) {
      return res.status(400).json({ success: false, message: 'Student, title, and comments are required.' });
    }

    const feedback = await TrainerFeedback.create({
      trainerId: req.user._id,
      studentId,
      targetType,
      referenceId: referenceId || null,
      title,
      comments,
      rating,
      actionItems
    });

    return res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/trainer/daily-report
exports.submitDailyReport = async (req, res) => {
  try {
    const { collegeId, batchId, date, topicCovered, practicalActivity, studentAttendanceCount, studentPerformanceSummary, assignmentsGiven, trainerRemarks } = req.body;
    if (!collegeId || !batchId || !topicCovered || !practicalActivity) {
      return res.status(400).json({ success: false, message: 'All required report fields must be filled.' });
    }

    const reportDate = date || new Date().toISOString().split('T')[0];

    const report = await DailyReport.findOneAndUpdate(
      { date: reportDate, batchId },
      {
        trainerId: req.user._id,
        collegeId,
        batchId,
        date: reportDate,
        topicCovered,
        practicalActivity,
        studentAttendanceCount: studentAttendanceCount || { present: 0, absent: 0, total: 0 },
        studentPerformanceSummary: studentPerformanceSummary || '',
        assignmentsGiven: assignmentsGiven || '',
        trainerRemarks: trainerRemarks || ''
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/trainer/daily-reports
exports.getDailyReports = async (req, res) => {
  try {
    const reports = await DailyReport.find({ trainerId: req.user._id })
      .sort({ date: -1 })
      .populate('collegeId', 'name')
      .populate('batchId', 'name code');

    return res.json({ success: true, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
