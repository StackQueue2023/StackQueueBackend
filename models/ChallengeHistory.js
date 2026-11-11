const mongoose = require('mongoose');

/**
 * ChallengeHistory — Tracks which Challenge questions have been
 * assigned/attempted by a student, ensuring no-repeat per student.
 */
const challengeHistorySchema = new mongoose.Schema({
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
  domain: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    index: true
  },
  dateAssigned: {
    type: Date,
    default: Date.now,
    index: true
  },
  attemptStatus: {
    type: String,
    enum: ['assigned', 'attempted', 'skipped'],
    default: 'assigned'
  },
  completionStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  score: {
    type: Number,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  answer: {
    type: String,
    default: ''
  },
  timeTakenSeconds: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// One history record per student per challenge
challengeHistorySchema.index({ studentId: 1, challengeId: 1 }, { unique: true });
challengeHistorySchema.index({ studentId: 1, domain: 1, completionStatus: 1 });

module.exports = mongoose.model('ChallengeHistory', challengeHistorySchema);
