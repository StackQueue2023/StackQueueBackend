const Session = require('../models/Session');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const { logAction } = require('../services/auditLogger');
const notificationService = require('../services/notificationService');
const curriculumEngine = require('../services/curriculumEngine');

// GET /api/sessions/today (Tutor / Trainer view)
exports.getTodaySessions = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    const filter = {
      scheduledDate: todayStr
    };

    // If user is tutor/trainer, only show their assigned sessions
    if (req.user.role === 'tutor' || req.user.role === 'trainer') {
      filter.tutorId = tutorId;
    }

    const sessions = await Session.find(filter)
      .sort({ scheduledStartDateTime: 1 })
      .populate('studentIds', 'name email avatar studentId')
      .populate('courseId', 'title category')
      .populate('batchId', 'name code mode')
      .populate('tutorId', 'name email avatar');

    // Dynamic status computation with default 10m grace period
    const enriched = sessions.map(s => {
      const dynamicStatus = s.computeCurrentStatus(10);
      const isBatch = !!s.batchId || (s.studentIds && s.studentIds.length > 1);
      return {
        ...s.toObject(),
        dynamicStatus,
        isBatch
      };
    });

    return res.json({
      success: true,
      data: enriched,
      todayDate: todayStr
    });
  } catch (error) {
    console.error('getTodaySessions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/student/today (Student view of today's class)
exports.getStudentTodayClass = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Find student's session for today or next upcoming
    const todaySession = await Session.findOne({
      studentIds: studentUserId,
      scheduledDate: todayStr,
      status: { $ne: 'CANCELLED' }
    })
      .populate('tutorId', 'name email avatar phone')
      .populate('courseId', 'title')
      .sort({ scheduledStartDateTime: 1 });

    let nextSession = null;
    if (!todaySession) {
      nextSession = await Session.findOne({
        studentIds: studentUserId,
        scheduledStartDateTime: { $gt: new Date() },
        status: 'UPCOMING'
      })
        .populate('tutorId', 'name email avatar')
        .populate('courseId', 'title')
        .sort({ scheduledStartDateTime: 1 });
    }

    const targetSession = todaySession || nextSession;
    let dynamicStatus = 'UPCOMING';
    let canJoin = false;
    let timingLabel = '';

    if (targetSession) {
      dynamicStatus = targetSession.computeCurrentStatus(10);
      const now = new Date();
      const diffMs = targetSession.scheduledStartDateTime.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / (60 * 1000));

      if (dynamicStatus === 'LIVE') {
        canJoin = true;
        timingLabel = 'Class is currently LIVE! Click to enter.';
      } else if (dynamicStatus === 'COMPLETED') {
        canJoin = false;
        timingLabel = 'Session has completed.';
      } else if (diffMinutes > 0 && diffMinutes <= 15) {
        canJoin = true;
        timingLabel = `Class starts in ${diffMinutes} minutes. Classroom ready.`;
      } else if (diffMinutes > 15) {
        canJoin = false;
        timingLabel = `Class starts at ${targetSession.startTime}`;
      } else if (dynamicStatus === 'DELAYED') {
        canJoin = true;
        timingLabel = 'Class is delayed. Tutor is starting shortly.';
      }
    }

    return res.json({
      success: true,
      data: targetSession ? {
        ...targetSession.toObject(),
        session: targetSession,
        dynamicStatus,
        canJoin,
        timingLabel,
        isToday: !!todaySession
      } : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/sessions/:id/start (Tutor starts session)
exports.startSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Authorization: only assigned tutor or admin
    if (req.user.role !== 'admin' && session.tutorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned tutor can start this session.' });
    }

    session.status = 'LIVE';
    session.actualStartTime = new Date();
    session.startedBy = req.user._id;
    await session.save();

    await logAction(req.user._id, 'SESSION_STARTED', 'Session', session._id, {
      topic: session.topic,
      actualStartTime: session.actualStartTime
    });

    // Notify students that class is live
    for (const stId of session.studentIds) {
      await notificationService.createInAppNotification(
        stId,
        `Class is LIVE: ${session.topic}`,
        `Your class with ${req.user.name} has started. Click to join now!`,
        'training_reminder',
        session.meetingLink
      );
    }

    return res.json({
      success: true,
      message: 'Session is now LIVE!',
      data: session
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/sessions/:id/end (Tutor ends session with task check)
exports.endSession = async (req, res) => {
  try {
    const { taskAssigned = false, relatedTaskId = null, tutorRemarks = '' } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (req.user.role !== 'admin' && session.tutorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned tutor can end this session.' });
    }

    const endTime = new Date();
    const startTime = session.actualStartTime || session.scheduledStartDateTime;
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)));

    session.status = 'COMPLETED';
    session.actualEndTime = endTime;
    session.actualDurationMinutes = durationMinutes;
    session.completedBy = req.user._id;
    session.taskAssigned = !!taskAssigned;
    if (relatedTaskId) session.relatedTaskId = relatedTaskId;
    if (tutorRemarks) session.tutorRemarks = tutorRemarks;

    await session.save();

    await logAction(req.user._id, 'SESSION_ENDED', 'Session', session._id, {
      topic: session.topic,
      durationMinutes,
      taskAssigned: session.taskAssigned
    });

    // Update student learning journey with completed topic
    for (const stId of session.studentIds) {
      const studentProfile = await StudentProfile.findOne({ userId: stId });
      if (studentProfile) {
        if (!studentProfile.learningJourney) {
          studentProfile.learningJourney = { completedTopics: [] };
        }
        const alreadyInCompleted = studentProfile.learningJourney.completedTopics.some(
          ct => ct.topicTitle.toLowerCase() === session.topic.toLowerCase()
        );
        if (!alreadyInCompleted) {
          studentProfile.learningJourney.completedTopics.push({
            topicTitle: session.topic,
            completedAt: new Date(),
            sessionId: session._id
          });
        }
        await studentProfile.save();
      }
    }

    return res.json({
      success: true,
      message: 'Session completed successfully.',
      data: session
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/sessions (Create / Schedule a session)
exports.createSession = async (req, res) => {
  try {
    const {
      courseId,
      batchId,
      tutorId,
      studentIds = [],
      title,
      topic,
      description = '',
      scheduledDate,
      startTime,
      endTime,
      meetingLink = 'https://meet.google.com/cq-live-class',
      sessionType = 'ONLINE'
    } = req.body;

    if (!courseId || !topic || !scheduledDate || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Course, topic, date, start time, and end time are required.' });
    }

    const assignedTutor = tutorId || req.user._id;
    const sessionId = `SES-${Date.now().toString().slice(-6)}`;

    // Parse combined Date timestamps
    const scheduledStartDateTime = new Date(`${scheduledDate} ${startTime}`);
    const scheduledEndDateTime = new Date(`${scheduledDate} ${endTime}`);

    const session = await Session.create({
      sessionId,
      courseId,
      batchId,
      tutorId: assignedTutor,
      studentIds,
      title: title || `${topic} Live Masterclass`,
      topic,
      description,
      scheduledDate,
      startTime,
      endTime,
      scheduledStartDateTime: isNaN(scheduledStartDateTime.getTime()) ? new Date() : scheduledStartDateTime,
      scheduledEndDateTime: isNaN(scheduledEndDateTime.getTime()) ? new Date(Date.now() + 60 * 60 * 1000) : scheduledEndDateTime,
      meetingLink,
      sessionType,
      status: 'UPCOMING'
    });

    await logAction(req.user._id, 'SESSION_CREATED', 'Session', session._id, { sessionId, topic });

    return res.status(201).json({
      success: true,
      message: 'Session scheduled successfully.',
      data: session
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/sessions/tutor/morning-digest (Triggers morning SMS)
exports.sendMorningDigest = async (req, res) => {
  try {
    const tutorId = req.body.tutorId || req.user._id;
    const result = await notificationService.sendMorningTutorDigest(tutorId);
    return res.json({
      success: true,
      message: 'Morning schedule digest generated and sent.',
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/curriculum/progress
exports.getCurriculumProgress = async (req, res) => {
  try {
    let studentId = req.query.studentId || (req.user.role === 'student' ? req.user._id : null);

    if (!studentId && (req.user.role === 'trainer' || req.user.role === 'tutor' || req.user.role === 'admin')) {
      const trainerProfile = await TrainerProfile.findOne({ userId: req.user._id });
      if (trainerProfile && trainerProfile.assignedStudents?.length > 0) {
        studentId = trainerProfile.assignedStudents[0];
      } else {
        const anyStudent = await StudentProfile.findOne();
        studentId = anyStudent?.userId;
      }
    }

    if (!studentId) {
      return res.json({
        success: true,
        data: {
          overallProgress: 0,
          completedTopics: [],
          totalTopics: 0,
          upcomingTopic: null,
          milestoneStatus: 'IN_PROGRESS'
        }
      });
    }

    const progress = await curriculumEngine.getStudentLearningProgress(studentId);
    if (!progress) {
      return res.json({
        success: true,
        data: {
          overallProgress: 0,
          completedTopics: [],
          totalTopics: 0,
          upcomingTopic: null,
          milestoneStatus: 'IN_PROGRESS'
        }
      });
    }
    return res.json({ success: true, data: progress });
  } catch (error) {
    console.error('getCurriculumProgress error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/sessions/student/my-live-classes
// Returns ALL live classes assigned to currently logged-in student ONLY
// ─────────────────────────────────────────────
exports.getStudentLiveClasses = async (req, res) => {
  try {
    const studentUserId = req.user._id;

    // Strictly scope query to student's User ID to ensure privacy
    const sessions = await Session.find({
      studentIds: studentUserId,
      status: { $ne: 'CANCELLED' }
    })
      .populate('tutorId', 'name email avatar phone')
      .populate('courseId', 'title slug')
      .sort({ scheduledStartDateTime: 1 });

    const enriched = sessions.map(s => {
      const dynamicStatus = s.computeCurrentStatus(10);
      const now = new Date();
      const diffMs = s.scheduledStartDateTime.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / (60 * 1000));
      let canJoin = false;
      let timingLabel = '';

      if (dynamicStatus === 'LIVE') {
        canJoin = true;
        timingLabel = 'Class is currently LIVE! Click to enter.';
      } else if (dynamicStatus === 'COMPLETED') {
        canJoin = false;
        timingLabel = 'Session has completed.';
      } else if (diffMinutes > 0 && diffMinutes <= 15) {
        canJoin = true;
        timingLabel = `Class starts in ${diffMinutes} minutes.`;
      } else if (diffMinutes > 15) {
        canJoin = false;
        timingLabel = `Scheduled for ${s.scheduledDate} at ${s.startTime}`;
      } else if (dynamicStatus === 'DELAYED') {
        canJoin = true;
        timingLabel = 'Class is delayed. Tutor is starting shortly.';
      } else if (dynamicStatus === 'MISSED') {
        canJoin = false;
        timingLabel = 'Session was missed.';
      } else {
        canJoin = true;
        timingLabel = `Scheduled for ${s.scheduledDate} at ${s.startTime}`;
      }

      return {
        ...s.toObject(),
        dynamicStatus,
        canJoin,
        timingLabel
      };
    });

    return res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    console.error('getStudentLiveClasses error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


