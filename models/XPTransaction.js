const mongoose = require('mongoose');

const xpTransactionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'challenge_solved',
      'first_attempt_bonus',
      'perfect_score_bonus',
      'daily_challenge_complete',
      'daily_challenge_all_bonus',
      'streak_bonus',
      'project_task_completed',
      'project_completed',
      'trainer_award',
      'badge_unlocked'
    ],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceModel: {
    type: String
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('XPTransaction', xpTransactionSchema);
