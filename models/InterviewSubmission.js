const mongoose = require('mongoose');

const interviewSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestion',
    required: true,
    index: true
  },
  questionNumber: {
    type: Number,
    required: true,
    index: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PASSED', 'FAILED', 'ERROR', 'TIMEOUT'],
    required: true,
    index: true
  },
  passedTests: {
    type: Number,
    default: 0
  },
  totalTests: {
    type: Number,
    default: 0
  },
  testResults: [{
    caseNumber: Number,
    input: String,
    expected: String,
    actual: String,
    passed: Boolean,
    isHidden: Boolean,
    error: String
  }],
  executionTimeMs: {
    type: Number,
    default: 0
  },
  memoryUsageMb: {
    type: Number,
    default: 0
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  hintsUsed: {
    type: Number,
    default: 0
  },
  xpAwarded: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSubmission', interviewSubmissionSchema);
