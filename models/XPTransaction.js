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
  xpAwarded: {
    type: Number
  },
  reason: {
    type: String,
    enum: [
      'challenge_solved',
      'first_attempt_bonus',
      'perfect_score_bonus',
      'daily_challenge_complete',
      'daily_challenge_all_bonus',
      'daily_challenge_solved',
      'interview_arena_solved',
      'mock_interview_solved',
      'module_question_solved',
      'concept_task_completed',
      'streak_bonus',
      'project_task_completed',
      'project_completed',
      'trainer_award',
      'badge_unlocked',
      'adaptive_mcq_solved',
      'adaptive_coding_solved'
    ],
    required: true
  },
  feature: {
    type: String,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  completionStatus: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
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

xpTransactionSchema.index({ studentId: 1, questionId: 1, feature: 1 });

module.exports = mongoose.model('XPTransaction', xpTransactionSchema);
