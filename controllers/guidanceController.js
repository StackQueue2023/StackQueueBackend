const TutorGuidance = require('../models/TutorGuidance');
const { logAction } = require('../services/auditLogger');
const notificationService = require('../services/notificationService');

// POST /api/guidance
exports.createGuidance = async (req, res) => {
  try {
    const { studentId, sessionId, message, priority = 'MEDIUM' } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({ success: false, message: 'Student ID and guidance message are required.' });
    }

    const guidance = await TutorGuidance.create({
      studentId,
      tutorId: req.user._id,
      sessionId: sessionId || null,
      message,
      priority
    });

    await logAction(req.user._id, 'GUIDANCE_CREATED', 'TutorGuidance', guidance._id, { priority, studentId });

    // Notify student
    await notificationService.createInAppNotification(
      studentId,
      `New Guidance from Your Tutor (${priority})`,
      message.length > 80 ? message.substring(0, 80) + '...' : message,
      'trainer_feedback',
      '/'
    );

    const populated = await TutorGuidance.findById(guidance._id).populate('tutorId', 'name email avatar');

    return res.status(201).json({
      success: true,
      message: 'Guidance note created successfully.',
      data: populated
    });
  } catch (error) {
    console.error('createGuidance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/guidance
// Students see their own guidance. Tutors/Admins can filter by ?studentId=...
exports.getGuidance = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    } else if (req.user.role === 'tutor' || req.user.role === 'trainer') {
      filter.tutorId = req.user._id;
    }

    const guidanceList = await TutorGuidance.find(filter)
      .sort({ createdAt: -1 })
      .populate('tutorId', 'name email avatar')
      .populate('studentId', 'name email avatar')
      .populate('sessionId', 'title topic scheduledDate');

    return res.json({
      success: true,
      data: guidanceList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/guidance/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const guidance = await TutorGuidance.findById(req.params.id);
    if (!guidance) {
      return res.status(404).json({ success: false, message: 'Guidance note not found.' });
    }

    if (req.user.role === 'student' && guidance.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    guidance.readStatus = true;
    await guidance.save();

    return res.json({
      success: true,
      data: guidance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
