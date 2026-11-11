const mongoose = require('mongoose');

const dailyChallengeHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  questionSource: {
    type: String,
    enum: ['InterviewQuestion', 'Challenge', 'ConceptTask'],
    default: 'InterviewQuestion'
  },
  questionFingerprint: {
    type: String,
    required: true,
    index: true
  },
  challengeDate: {
    type: String, // format YYYY-MM-DD
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['SERVED', 'COMPLETED', 'FAILED'],
    default: 'SERVED'
  },
  servedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  xpEarned: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

dailyChallengeHistorySchema.index({ studentId: 1, questionId: 1 }, { unique: true });
dailyChallengeHistorySchema.index({ studentId: 1, challengeDate: 1 });

module.exports = mongoose.model('DailyChallengeHistory', dailyChallengeHistorySchema);
