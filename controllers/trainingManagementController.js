const TrainingTaskAssignment = require('../models/TrainingTaskAssignment');
const EmailNotificationHistory = require('../models/EmailNotificationHistory');
const Batch = require('../models/Batch');
const College = require('../models/College');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const {
  toDateStr,
  syncStudentDailyPerformance,
  getTemporaryStudentDashboard,
  getOverallTrainingBatchPerformance,
  computeAndSaveWeeklySummary,
} = require('../services/trainingPerformanceService');
const {
  generateWeeklyTrainingPdfBuffer,
  sendDailyTrainingReportEmail,
  sendWeeklyTrainingReportEmail,
  checkAndSendCompletionEmail,
} = require('../services/trainingNotificationService');

exports.getMyTrainingDashboard = async (req, res) => {
  try {
    const dashboard = await getTemporaryStudentDashboard(req.user._id);
    return res.json({ success: true, ...dashboard });
  } catch (err) {
    console.error('getMyTrainingDashboard error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getStudentTrainingDashboardById = async (req, res) => {
  try {
    const dashboard = await getTemporaryStudentDashboard(req.params.studentId);
    return res.json({ success: true, ...dashboard });
  } catch (err) {
    console.error('getStudentTrainingDashboardById error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.completeTrainingTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await TrainingTaskAssignment.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Training task not found' });
    }
    if (req.user.role === 'student' && String(task.studentId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied for this task' });
    }

    if (task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
      await task.save();
    }

    await syncStudentDailyPerformance(task.studentId, task.batchId, toDateStr(task.assignedDate));
    const completionEmailResult = await checkAndSendCompletionEmail(task.studentId);
    const dashboard = await getTemporaryStudentDashboard(task.studentId);

    return res.json({
      success: true,
      message: 'Training task marked as completed',
      task,
      completionEmailResult,
      dashboard,
    });
  } catch (err) {
    console.error('completeTrainingTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOverallPerformance = async (req, res) => {
  try {
    const { batchId, collegeId, date } = req.query;
    const data = await getOverallTrainingBatchPerformance({
      batchId: batchId || null,
      collegeId: collegeId || null,
      date: date || null,
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    console.error('getOverallPerformance error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignTrainingTasks = async (req, res) => {
  try {
    const { batchId, studentIds, title, description = '', domain = '', dueDate = null, points = 10, assignedDate } = req.body;
    if (!title || (!batchId && (!Array.isArray(studentIds) || studentIds.length === 0))) {
      return res.status(400).json({
        success: false,
        message: 'Task title and either batchId or studentIds are required.',
      });
    }

    let targetStudentIds = Array.isArray(studentIds) ? studentIds : [];
    let batch = null;
    if (batchId) {
      batch = await Batch.findById(batchId).lean();
      if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
      if (targetStudentIds.length === 0) {
        targetStudentIds = batch.studentIds || [];
      }
    }

    const targetUsers = await User.find({
      _id: { $in: targetStudentIds },
      role: 'student'
    })
      .select('_id name email')
      .lean();

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid students found in target selection.',
      });
    }

    const profiles = await StudentProfile.find({ userId: { $in: targetUsers.map((u) => u._id) } })
      .select('userId collegeId')
      .lean();
    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

    const effectiveAssignedDateStr = toDateStr(assignedDate || new Date());
    const effectiveDueDateStr = dueDate ? toDateStr(dueDate) : null;

    const docs = targetUsers.map((u) => ({
      studentId: u._id,
      batchId: batch?._id || batchId || null,
      collegeId: batch?.collegeId || profileMap.get(String(u._id))?.collegeId || null,
      assignedBy: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      domain: String(domain || batch?.courseId?.title || batch?.domain || 'General Training').trim(),
      assignedDate: effectiveAssignedDateStr,
      dueDate: effectiveDueDateStr,
      status: 'assigned',
      points: Number(points) || 10,
    }));

    const created = await TrainingTaskAssignment.insertMany(docs);
    for (const u of targetUsers) {
      await syncStudentDailyPerformance(u._id, batch?._id || batchId || null, effectiveAssignedDateStr);
    }

    return res.status(201).json({
      success: true,
      message: `Assigned task "${title}" to ${created.length} training student(s).`,
      assignedCount: created.length,
      tasks: created,
    });
  } catch (err) {
    console.error('assignTrainingTasks error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.triggerDailyReportEmail = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { date, force } = req.body || {};
    const result = await sendDailyTrainingReportEmail(batchId, date || null, { force: Boolean(force) });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('triggerDailyReportEmail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.triggerWeeklyReportEmail = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { weekStart, weekEnd, force } = req.body || {};
    const result = await sendWeeklyTrainingReportEmail(batchId, weekStart || null, weekEnd || null, {
      force: Boolean(force),
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('triggerWeeklyReportEmail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadWeeklyReportPdf = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { weekStart, weekEnd } = req.query;
    const batch = await Batch.findById(batchId).lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    const college = batch.collegeId ? await College.findById(batch.collegeId).lean() : null;
    const summary = await computeAndSaveWeeklySummary(batchId, weekStart || null, weekEnd || null);
    const pdfBuffer = await generateWeeklyTrainingPdfBuffer(summary, batch, college);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="weekly-training-report-${summary.weekStart}_to_${summary.weekEnd}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('downloadWeeklyReportPdf error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNotificationHistory = async (req, res) => {
  try {
    const { batchId, type } = req.query;
    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (type) filter.notificationType = type;

    const history = await EmailNotificationHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('studentId', 'name email')
      .populate('batchId', 'batchName name')
      .populate('collegeId', 'name')
      .lean();

    return res.json({ success: true, history });
  } catch (err) {
    console.error('getNotificationHistory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listTemporaryStudents = async (req, res) => {
  try {
    const data = await getOverallTrainingBatchPerformance({
      batchId: req.query.batchId || null,
      collegeId: req.query.collegeId || null,
      date: req.query.date || null,
    });
    return res.json({ success: true, students: data.students, summary: data.summary });
  } catch (err) {
    console.error('listTemporaryStudents error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markTrainingAttendance = async (req, res) => {
  try {
    const { batchId, date, records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'records array is required' });
    }
    const targetDate = date ? toDateStr(date) : toDateStr(new Date());
    const StudentAttendance = require('../models/StudentAttendance');

    const ops = records.map((r) => {
      const normalizedStatus =
        (r.status || 'present').toLowerCase() === 'absent'
          ? 'Absent'
          : (r.status || 'present').toLowerCase() === 'leave'
          ? 'Leave'
          : 'Present';

      return {
        updateOne: {
          filter: { date: targetDate, studentId: r.studentId },
          update: {
            $set: {
              status: normalizedStatus,
              batchId: batchId || undefined,
              markedBy: req.user?._id,
            },
          },
          upsert: true,
        },
      };
    });

    await StudentAttendance.bulkWrite(ops);

    return res.json({
      success: true,
      message: `Successfully marked attendance for ${records.length} students on ${targetDate}`,
    });
  } catch (err) {
    console.error('markTrainingAttendance error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentPerformanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const User = require('../models/User');
    const StudentProfile = require('../models/StudentProfile');
    const StudentAttendance = require('../models/StudentAttendance');
    const TrainingTaskAssignment = require('../models/TrainingTaskAssignment');
    const Batch = require('../models/Batch');

    const user = await User.findById(studentId).select('_id name email username rollNo department studentType').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });

    const [profile, attendance, tasks, batch] = await Promise.all([
      StudentProfile.findOne({ userId: studentId }).lean(),
      StudentAttendance.find({ studentId }).sort({ date: -1 }).lean(),
      TrainingTaskAssignment.find({ studentId }).sort({ assignedDate: -1 }).lean(),
      Batch.findOne({ studentIds: studentId }).populate('collegeId').lean(),
    ]);

    const presentDays = attendance.filter((a) => (a.status || '').toLowerCase() === 'present').length;
    const totalDays = attendance.length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.json({
      success: true,
      student: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        department: user.department || profile?.department || batch?.department || 'CSE',
        collegeName: batch?.collegeId?.name || 'Partner College',
        batchName: batch?.name || 'College Batch',
        batchCode: batch?.code || 'N/A',
        attendance: {
          presentDays,
          totalDays,
          attendancePercent,
        },
        tasks: {
          totalTasks,
          completedTasks,
          pendingTasks: Math.max(0, totalTasks - completedTasks),
          completionPercent,
        },
        tasksList: tasks,
        attendanceList: attendance,
      },
    });
  } catch (err) {
    console.error('getStudentPerformanceReport error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
