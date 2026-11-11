const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true,
    index: true
  },
  gameSlug: {
    type: String,
    required: true
  },
  submittedCode: {
    type: String,
    default: ''
  },
  passed: {
    type: Boolean,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  executionTimeMs: {
    type: Number,
    default: 0
  },
  hintsUsed: {
    type: Number,
    default: 0
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  evaluationDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  trainerFeedback: {
    type: String,
    default: ''
  }
}, { timestamps: true });

attemptSchema.index({ gameSlug: 1, passed: 1 });
attemptSchema.index({ studentId: 1, createdAt: -1 });
attemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Attempt', attemptSchema);
