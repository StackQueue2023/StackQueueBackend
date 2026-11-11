const mongoose = require('mongoose');

/**
 * DomainTask — A single task inside a module for a domain (course).
 * Tutor can enable/disable tasks sequentially.
 */
const domainTaskSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  inputDescription: {
    type: String,
    default: ''
  },
  sampleInput: {
    type: String,
    default: ''
  },
  sampleOutput: {
    type: String,
    default: ''
  },
  expectedOutput: {
    type: String,
    default: ''
  },
  constraints: {
    type: String,
    default: ''
  },
  starterCode: {
    type: String,
    default: ''
  },
  timeLimit: {
    type: Number,
    default: 2000
  },
  testCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    isHidden: { type: Boolean, default: false },
    explanation: { type: String, default: '' }
  }],
  taskType: {
    type: String,
    enum: ['coding', 'mcq', 'quiz', 'debugging', 'challenge', 'practical', 'game', 'reading', 'exercise', 'project'],
    default: 'coding'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  estimatedTime: {
    type: String,
    default: '20 mins'
  },
  points: {
    type: Number,
    default: 10
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  problemStatement: {
    type: String,
    default: ''
  },
  inputFormat: {
    type: String,
    default: ''
  },
  outputFormat: {
    type: String,
    default: ''
  },
  referenceSolution: {
    type: String,
    default: ''
  },
  explanation: {
    type: String,
    default: ''
  },
  targetFeature: {
    type: String,
    default: 'TESTING_PRACTICE',
    index: true
  },
  technology: {
    type: String,
    default: '',
    index: true
  },
  compiler: {
    type: String,
    default: ''
  },
  evaluationMethod: {
    type: String,
    enum: ['coding', 'preview', 'query', 'scenario', 'conceptual'],
    default: 'coding',
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'tested', 'flagged', 'pending'],
    default: 'verified',
    index: true
  },
  isTested: {
    type: Boolean,
    default: false
  },
  testingResult: {
    passed: { type: Boolean, default: false },
    actualOutput: { type: String, default: '' },
    executionTimeMs: { type: Number, default: 0 },
    error: { type: String, default: null },
    executedAt: { type: Date, default: null }
  },
  // Tutor-controlled unlock: globally enabled for all students in this module
  isEnabled: {
    type: Boolean,
    default: false
  },
  enabledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  enabledAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

domainTaskSchema.index({ moduleId: 1, order: 1 });
domainTaskSchema.index({ courseId: 1, domain: 1, order: 1 });

module.exports = mongoose.model('DomainTask', domainTaskSchema);
