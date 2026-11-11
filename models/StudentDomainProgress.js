const mongoose = require('mongoose');

/**
 * StudentDomainProgress — Tracks each student's progress on each DomainTask.
 * status: locked → available → in_progress → completed
 */
const studentDomainProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domainTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DomainTask',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['locked', 'available', 'in_progress', 'completed'],
    default: 'locked',
    index: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  submittedCode: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'java'
  },
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  lastRunResults: [{
    caseNumber: Number,
    input: String,
    expected: String,
    actual: String,
    passed: Boolean,
    error: String,
    executionTimeMs: Number
  }],
  submissions: [{
    code: String,
    language: String,
    score: Number,
    testCasesPassed: Number,
    totalTestCases: Number,
    status: String,
    submittedAt: { type: Date, default: Date.now },
    testResults: Array
  }],
  submission: {
    textAnswer: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    submittedAt: { type: Date, default: null }
  },
  tutorFeedback: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// One progress record per student per task
studentDomainProgressSchema.index({ studentId: 1, domainTaskId: 1 }, { unique: true });
studentDomainProgressSchema.index({ studentId: 1, moduleId: 1 });
studentDomainProgressSchema.index({ studentId: 1, domain: 1 });

module.exports = mongoose.model('StudentDomainProgress', studentDomainProgressSchema);
