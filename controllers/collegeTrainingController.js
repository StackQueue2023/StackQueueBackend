const CollegeTraining = require('../models/CollegeTraining');
const DailyTrainingReport = require('../models/DailyTrainingReport');
const TrainerProfile = require('../models/TrainerProfile');
const College = require('../models/College');
const Batch = require('../models/Batch');

/**
 * 1. GET /api/trainer/college-trainings
 * Fetch all college trainings assigned to the logged-in tutor/trainer.
 * Auto-creates a training record if tutor has assigned colleges/batches in profile but no training in DB yet.
 */
exports.getAssignedTrainings = async (req, res) => {
  try {
    const tutorId = req.user._id;

    let trainings = await CollegeTraining.find({ tutorId })
      .populate('collegeId', 'name location')
      .populate('batchId', 'name code department')
      .sort({ createdAt: -1 });

    // Query only actual assigned college trainings for this tutor from DB

    // Attach summary stats (completed days & next available day) for each training card
    const formattedTrainings = await Promise.all(trainings.map(async (t) => {
      const reports = await DailyTrainingReport.find({ trainingId: t._id }).select('dayNumber date submittedAt');
      const completedDayNumbers = reports.map(r => r.dayNumber);
      const maxCompletedDay = completedDayNumbers.length > 0 ? Math.max(...completedDayNumbers) : 0;
      const currentAvailableDay = Math.min(t.totalDays, maxCompletedDay + 1);

      return {
        _id: t._id,
        collegeName: t.collegeName,
        trainingName: t.trainingName,
        batchName: t.batchName,
        totalStudents: t.totalStudents,
        totalDays: t.totalDays,
        startDate: t.startDate,
        endDate: t.endDate,
        currentDay: currentAvailableDay,
        completedDaysCount: completedDayNumbers.length,
        progressPercent: Math.round((completedDayNumbers.length / t.totalDays) * 100),
        status: t.status,
        createdAt: t.createdAt
      };
    }));

    return res.json({
      success: true,
      data: formattedTrainings
    });
  } catch (error) {
    console.error('getAssignedTrainings error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching assigned trainings.' });
  }
};

/**
 * 2. GET /api/trainer/college-trainings/:trainingId
 * Get College Training Details, progress bar, and complete day-by-day timeline with access control statuses.
 */
exports.getTrainingDetails = async (req, res) => {
  try {
    const { trainingId } = req.params;
    const tutorId = req.user._id;

    const training = await CollegeTraining.findById(trainingId)
      .populate('collegeId', 'name location')
      .populate('batchId', 'name code department');

    if (!training) {
      return res.status(404).json({ success: false, message: 'College training record not found.' });
    }

    // Security Check: Tutor can only view trainings assigned to them (or admin)
    if (training.tutorId.toString() !== tutorId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only access trainings assigned to you.' });
    }

    // Fetch all submitted daily reports for this training
    const submittedReports = await DailyTrainingReport.find({ trainingId })
      .select('dayNumber date morningTopic afternoonTopic studentsPresent studentsAbsent practicalConducted complaintReported submittedAt')
      .sort({ dayNumber: 1 });

    const reportsMap = new Map();
    submittedReports.forEach(r => reportsMap.set(r.dayNumber, r));

    const completedDayNumbers = Array.from(reportsMap.keys());
    const maxCompletedDay = completedDayNumbers.length > 0 ? Math.max(...completedDayNumbers) : 0;
    const maxAvailableDay = Math.min(training.totalDays, maxCompletedDay + 1);

    // Build Day-by-Day Timeline Array
    const timeline = [];
    const startDate = new Date(training.startDate);

    for (let day = 1; day <= training.totalDays; day++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + (day - 1));
      const formattedDateStr = dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      let accessStatus = 'LOCKED'; // Default: Locked
      let reportData = null;

      if (reportsMap.has(day)) {
        accessStatus = 'COMPLETED';
        reportData = reportsMap.get(day);
      } else if (day === maxAvailableDay) {
        accessStatus = 'AVAILABLE';
      }

      timeline.push({
        dayNumber: day,
        dateStr: formattedDateStr,
        isoDate: dayDate.toISOString().split('T')[0],
        status: accessStatus,
        isEditable: accessStatus === 'AVAILABLE',
        isCompleted: accessStatus === 'COMPLETED',
        isLocked: accessStatus === 'LOCKED',
        reportSummary: reportData
      });
    }

    const completedDaysCount = completedDayNumbers.length;
    const remainingDaysCount = training.totalDays - completedDaysCount;
    const progressPercent = Math.round((completedDaysCount / training.totalDays) * 100);

    return res.json({
      success: true,
      data: {
        training: {
          _id: training._id,
          collegeName: training.collegeName,
          trainingName: training.trainingName,
          batchName: training.batchName,
          totalStudents: training.totalStudents,
          totalDays: training.totalDays,
          startDate: training.startDate,
          endDate: training.endDate,
          status: training.status,
          tutorName: req.user.name
        },
        progress: {
          completedDaysCount,
          remainingDaysCount,
          progressPercent,
          currentAvailableDay: maxAvailableDay
        },
        timeline
      }
    });
  } catch (error) {
    console.error('getTrainingDetails error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching training details.' });
  }
};

/**
 * 3. GET /api/trainer/college-trainings/:trainingId/day/:dayNumber
 * Get report for a specific day. Enforces backend access control (locks future days).
 */
exports.getDayReport = async (req, res) => {
  try {
    const { trainingId, dayNumber } = req.params;
    const dayNum = parseInt(dayNumber, 10);
    const tutorId = req.user._id;

    const training = await CollegeTraining.findById(trainingId);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found.' });
    }

    if (training.tutorId.toString() !== tutorId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only access your assigned training.' });
    }

    // Calculate max allowed day (Backend Enforcement)
    const existingReports = await DailyTrainingReport.find({ trainingId }).select('dayNumber');
    const completedDays = existingReports.map(r => r.dayNumber);
    const maxCompletedDay = completedDays.length > 0 ? Math.max(...completedDays) : 0;
    const maxAvailableDay = Math.min(training.totalDays, maxCompletedDay + 1);

    // SECURITY CHECK: Future days cannot be accessed!
    if (dayNum > maxAvailableDay && !completedDays.includes(dayNum)) {
      return res.status(403).json({
        success: false,
        message: `Day ${dayNum} is locked. You must complete Day ${maxAvailableDay} first.`
      });
    }

    // Check if report already exists for this day
    const existingReport = await DailyTrainingReport.findOne({ trainingId, dayNumber: dayNum });

    const startDate = new Date(training.startDate);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (dayNum - 1));
    const formattedDate = dayDate.toISOString().split('T')[0];

    if (existingReport) {
      return res.json({
        success: true,
        isCompleted: true,
        isEditable: false,
        data: existingReport,
        trainingInfo: {
          collegeName: training.collegeName,
          trainingName: training.trainingName,
          batchName: training.batchName,
          totalStudents: training.totalStudents
        }
      });
    }

    // Return empty report form template for available day
    return res.json({
      success: true,
      isCompleted: false,
      isEditable: true,
      data: {
        trainingId,
        dayNumber: dayNum,
        date: formattedDate,
        totalStudents: training.totalStudents,
        studentsPresent: training.totalStudents,
        studentsAbsent: 0,
        morningTopic: '',
        afternoonTopic: '',
        practicalConducted: true,
        practicalTasks: ['Create a Java Bank Account class', 'Implement exception handling'],
        studentFeedbackReceived: false,
        studentFeedback: '',
        studentPositiveFeedback: '',
        studentDifficulties: '',
        studentSuggestions: '',
        complaintReported: false,
        complaintRaisedBy: 'Student',
        complaintName: '',
        complaintCategory: 'Training',
        complaintDetails: '',
        complaintPriority: 'Medium',
        actionTaken: '',
        complaintStatus: 'Open',
        trainerRemarks: ''
      },
      trainingInfo: {
        collegeName: training.collegeName,
        trainingName: training.trainingName,
        batchName: training.batchName,
        totalStudents: training.totalStudents
      }
    });
  } catch (error) {
    console.error('getDayReport error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error loading day report.' });
  }
};

/**
 * 4. POST /api/trainer/college-trainings/:trainingId/day/:dayNumber/submit
 * Submit Daily Training Report for a specific day.
 */
exports.submitDayReport = async (req, res) => {
  try {
    const { trainingId, dayNumber } = req.params;
    const dayNum = parseInt(dayNumber, 10);
    const tutorId = req.user._id;

    const training = await CollegeTraining.findById(trainingId);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found.' });
    }

    if (training.tutorId.toString() !== tutorId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only submit reports for your assigned training.' });
    }

    // 1. Backend Lock Enforcement
    const existingReports = await DailyTrainingReport.find({ trainingId }).select('dayNumber');
    const completedDays = existingReports.map(r => r.dayNumber);
    const maxCompletedDay = completedDays.length > 0 ? Math.max(...completedDays) : 0;
    const maxAvailableDay = Math.min(training.totalDays, maxCompletedDay + 1);

    if (dayNum > maxAvailableDay) {
      return res.status(403).json({
        success: false,
        message: `Security Lock: Cannot submit report for Day ${dayNum}. Day ${maxAvailableDay} must be submitted first.`
      });
    }

    // 2. Prevent Duplicate Submission for Same Day
    if (completedDays.includes(dayNum)) {
      return res.status(400).json({
        success: false,
        message: `Day ${dayNum} report has already been submitted and completed.`
      });
    }

    const {
      date,
      morningTopic,
      afternoonTopic,
      studentsPresent,
      studentsAbsent,
      totalStudents,
      practicalConducted,
      practicalTasks,
      studentFeedbackReceived,
      studentFeedback,
      studentPositiveFeedback,
      studentDifficulties,
      studentSuggestions,
      complaintReported,
      complaintRaisedBy,
      complaintName,
      complaintCategory,
      complaintDetails,
      complaintPriority,
      actionTaken,
      complaintStatus,
      trainerRemarks
    } = req.body;

    // 3. Validation: Morning & Afternoon topics required
    if (!morningTopic || !morningTopic.trim()) {
      return res.status(400).json({ success: false, message: 'Morning Session Topic Covered is required.' });
    }
    if (!afternoonTopic || !afternoonTopic.trim()) {
      return res.status(400).json({ success: false, message: 'Afternoon Session Topic Covered is required.' });
    }

    // 4. Validation: Present + Absent MUST equal Total Students
    const presentNum = Number(studentsPresent || 0);
    const absentNum = Number(studentsAbsent || 0);
    const totalNum = Number(totalStudents || training.totalStudents);

    if (presentNum + absentNum !== totalNum) {
      return res.status(400).json({
        success: false,
        message: `Attendance Validation Error: Present (${presentNum}) + Absent (${absentNum}) must equal total students (${totalNum}).`
      });
    }

    // Create Daily Training Report
    const report = await DailyTrainingReport.create({
      trainingId,
      dayNumber: dayNum,
      date: date || new Date().toISOString().split('T')[0],
      morningTopic: morningTopic.trim(),
      afternoonTopic: afternoonTopic.trim(),
      studentsPresent: presentNum,
      studentsAbsent: absentNum,
      totalStudents: totalNum,
      practicalConducted: Boolean(practicalConducted),
      practicalTasks: Array.isArray(practicalTasks) ? practicalTasks.filter(t => t && t.trim()) : [],
      studentFeedbackReceived: Boolean(studentFeedbackReceived),
      studentFeedback: studentFeedback ? studentFeedback.trim() : '',
      studentPositiveFeedback: studentPositiveFeedback ? studentPositiveFeedback.trim() : '',
      studentDifficulties: studentDifficulties ? studentDifficulties.trim() : '',
      studentSuggestions: studentSuggestions ? studentSuggestions.trim() : '',
      complaintReported: Boolean(complaintReported),
      complaintRaisedBy: complaintRaisedBy || 'Student',
      complaintName: complaintName ? complaintName.trim() : '',
      complaintCategory: complaintCategory || 'Training',
      complaintDetails: complaintDetails ? complaintDetails.trim() : '',
      complaintPriority: complaintPriority || 'Medium',
      actionTaken: actionTaken ? actionTaken.trim() : '',
      complaintStatus: complaintStatus || 'Open',
      trainerRemarks: trainerRemarks ? trainerRemarks.trim() : '',
      submittedBy: tutorId,
      submittedAt: new Date()
    });

    // Update CollegeTraining progress
    training.currentDay = Math.min(training.totalDays, dayNum + 1);
    if (dayNum >= training.totalDays) {
      training.status = 'COMPLETED';
    }
    await training.save();

    return res.status(201).json({
      success: true,
      message: `✓ Day ${dayNum} Report Submitted Successfully`,
      data: report
    });
  } catch (error) {
    console.error('submitDayReport error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Day ${req.params.dayNumber} report has already been submitted.` });
    }
    return res.status(500).json({ success: false, message: error.message || 'Error submitting day report.' });
  }
};
