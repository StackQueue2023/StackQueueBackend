const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'challenge_unlocked',
      'challenge_completed',
      'badge_earned',
      'trainer_feedback',
      'new_project',
      'assignment',
      'attendance_warning',
      'training_reminder',
      'leaderboard_update',
      'streak_milestone',
      'project_requirement_published',
      'project_assigned',
      'project_submitted',
      'project_revision_requested',
      'project_sent_to_admin',
      'project_approved',
      'project_rejected',
      'project_github_synced',
      'project_github_failed',
      'fee_reminder'
    ],
    default: 'challenge_unlocked'
  },
  link: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
