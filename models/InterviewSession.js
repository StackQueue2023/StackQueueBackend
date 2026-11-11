const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  domain: {
    type: String,
    default: 'java'
  },
  language: {
    type: String,
    default: 'java'
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  difficulty: {
    type: String,
    default: 'Mixed'
  },
  questionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestion'
  }],
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
    default: 'IN_PROGRESS'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  results: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion'
    },
    questionNumber: Number,
    passed: Boolean,
    score: Number,
    attempts: Number,
    submittedCode: String
  }],
  stats: {
    questionsAttempted: { type: Number, default: 0 },
    questionsPassed: { type: Number, default: 0 },
    questionsFailed: { type: Number, default: 0 },
    timeUsedSeconds: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
