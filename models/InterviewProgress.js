const mongoose = require('mongoose');

const interviewProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  unlockedLevel: {
    type: Number,
    default: 1
  },
  solvedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion'
    },
    questionNumber: Number,
    difficulty: String,
    category: String,
    solvedAt: { type: Date, default: Date.now },
    language: String,
    attempts: Number
  }],
  totalSolved: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  easySolved: {
    type: Number,
    default: 0
  },
  mediumSolved: {
    type: Number,
    default: 0
  },
  hardSolved: {
    type: Number,
    default: 0
  },
  categoryProgress: {
    type: Map,
    of: Number,
    default: {}
  },
  lastSolvedDate: {
    type: String, // YYYY-MM-DD
    default: ''
  },
  totalInterviewXp: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewProgress', interviewProgressSchema);
