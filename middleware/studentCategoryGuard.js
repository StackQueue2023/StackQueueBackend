const StudentProfile = require('../models/StudentProfile');

function isTemporaryTrainingStudent(userOrProfile) {
  if (!userOrProfile) return false;
  return (
    userOrProfile.studentCategory === 'TRAINING_TEMPORARY' ||
    userOrProfile.studentType === 'TRAINING_TEMPORARY'
  );
}

/**
 * Blocks Temporary Training / Orientation Students from accessing Regular Course-only
 * features such as Payment Management, Fee Reminders, and Leave Management.
 */
async function requireRegularStudent(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return next();
    }

    if (isTemporaryTrainingStudent(req.user)) {
      return res.status(403).json({
        success: false,
        code: 'TRAINING_STUDENT_RESTRICTED',
        message: 'This section is available only for Regular Course Students. Training / Orientation students do not have access to Payment or Leave Management.'
      });
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id })
      .select('studentCategory studentType')
      .lean();

    if (isTemporaryTrainingStudent(profile)) {
      return res.status(403).json({
        success: false,
        code: 'TRAINING_STUDENT_RESTRICTED',
        message: 'This section is available only for Regular Course Students. Training / Orientation students do not have access to Payment or Leave Management.'
      });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  isTemporaryTrainingStudent,
  requireRegularStudent
};
