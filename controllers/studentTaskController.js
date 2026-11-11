const StudentTask = require('../models/StudentTask');
const Session = require('../models/Session');
const { awardXp } = require('../services/xpEngine');
const { logAction } = require('../services/auditLogger');
const notificationService = require('../services/notificationService');

// POST /api/tasks (Tutor creates task related to a session)
exports.createTask = async (req, res) => {
  try {
    const {
      sessionId,
      studentId,
      title,
      description,
      instructions = '',
      attachment = '',
      dueDate
    } = req.body;

    if (!sessionId || !studentId || !title || !description || !dueDate) {
      return res.status(400).json({ success: false, message: 'Session, student, title, description, and dueDate are required.' });
    }

    const taskId = `TSK-${Date.now().toString().slice(-6)}`;

    const task = await StudentTask.create({
      taskId,
      sessionId,
      studentId,
      tutorId: req.user._id,
      title,
      description,
      instructions,
      attachment,
      dueDate: new Date(dueDate),
      status: 'ASSIGNED'
    });

    // Link task to the session
    await Session.findByIdAndUpdate(sessionId, {
      taskAssigned: true,
      relatedTaskId: task._id
    });

    await logAction(req.user._id, 'TASK_CREATED', 'StudentTask', task._id, { title, studentId });

    // In-app notification for student
    await notificationService.createInAppNotification(
      studentId,
      `New Task Assigned: ${title}`,
      `Your tutor has assigned a new task due on ${new Date(dueDate).toLocaleDateString()}.`,
      'assignment',
      '/'
    );

    return res.status(201).json({
      success: true,
      message: 'Task assigned successfully.',
      data: task
    });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks (Student or Tutor view)
exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    const { status, studentId } = req.query;

    if (status) filter.status = status;

    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } else if (req.user.role === 'tutor' || req.user.role === 'trainer') {
      if (studentId) filter.studentId = studentId;
      else filter.tutorId = req.user._id;
    } else if (studentId) {
      filter.studentId = studentId;
    }

    const tasks = await StudentTask.find(filter)
      .sort({ createdAt: -1 })
      .populate('sessionId', 'title topic scheduledDate')
      .populate('studentId', 'name email avatar')
      .populate('tutorId', 'name email avatar');

    return res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/:id/submit (Student submits assignment)
exports.submitTask = async (req, res) => {
  try {
    const { textAnswer = '', fileUrl = '', githubUrl = '' } = req.body;
    const task = await StudentTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (req.user.role === 'student' && task.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only submit your own tasks.' });
    }

    task.submission = {
      textAnswer,
      fileUrl,
      githubUrl,
      submittedAt: new Date()
    };
    task.status = 'SUBMITTED';
    await task.save();

    await logAction(req.user._id, 'TASK_SUBMITTED', 'StudentTask', task._id, {
      title: task.title,
      submittedAt: task.submission.submittedAt
    });

    // Notify tutor
    await notificationService.createInAppNotification(
      task.tutorId,
      `Task Submitted: ${task.title}`,
      `Student ${req.user.name} submitted their assignment. Ready for review.`,
      'assignment',
      '/trainer'
    );

    return res.json({
      success: true,
      message: 'Task submitted for tutor review!',
      data: task
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/:id/review (Tutor reviews and grades task)
exports.reviewTask = async (req, res) => {
  try {
    const { status, tutorFeedback = '', score = 90 } = req.body;
    const task = await StudentTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (req.user.role !== 'admin' && task.tutorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned tutor can review this task.' });
    }

    task.status = status || 'COMPLETED';
    task.tutorFeedback = tutorFeedback;
    task.score = Number(score);
    task.reviewedAt = new Date();

    if (task.status === 'COMPLETED' && task.xpAwarded === 0) {
      task.xpAwarded = 40; // Award 40 XP for approved homework task
      await awardXp(
        task.studentId,
        task.xpAwarded,
        'project_task_completed',
        task._id,
        'StudentTask',
        `Completed session task: ${task.title}`
      );
    }

    await task.save();

    const action = task.status === 'COMPLETED' ? 'TASK_APPROVED' : 'TASK_REJECTED';
    await logAction(req.user._id, action, 'StudentTask', task._id, { score: task.score, feedback: tutorFeedback });

    // Notify student
    await notificationService.createInAppNotification(
      task.studentId,
      `Task Review: ${task.title} (${task.status})`,
      `Your tutor has reviewed your submission. Score: ${task.score}/100. Feedback: "${tutorFeedback}"`,
      'trainer_feedback',
      '/'
    );

    return res.json({
      success: true,
      message: `Task ${task.status === 'COMPLETED' ? 'Approved' : 'Reviewed'} successfully.`,
      data: task
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
