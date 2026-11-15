const mongoose = require('mongoose');

const syllabusGenerationJobSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['syllabus_tasks', 'ai_questions', 'combined'],
    default: 'combined'
  },
  syllabusText: {
    type: String,
    default: ''
  },
  tasksPerModule: {
    type: Number,
    default: 12
  },
  parsedModules: [{
    order: { type: Number, default: 1 },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    topics: [{ type: String }]
  }],
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed', 'cancelled', 'partial'],
    default: 'pending',
    index: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentModule: {
    type: String,
    default: ''
  },
  currentStep: {
    type: String,
    default: 'Initialized'
  },
  stats: {
    totalModules: { type: Number, default: 0 },
    completedModules: { type: Number, default: 0 },
    failedModules: { type: Number, default: 0 },
    interviewArenaCount: { type: Number, default: 0 },
    mockInterviewCount: { type: Number, default: 0 },
    moduleQuestionsCount: { type: Number, default: 0 },
    testingPracticeCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    verifiedCount: { type: Number, default: 0 },
    testedCount: { type: Number, default: 0 },
    flaggedCount: { type: Number, default: 0 },
    failedBatches: { type: Number, default: 0 },
    remainingBatches: { type: Number, default: 0 }
  },
  moduleProgress: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    title: { type: String, default: '' },
    order: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' },
    progress: { type: Number, default: 0 },
    questionsCount: { type: Number, default: 0 },
    testedCount: { type: Number, default: 0 },
    error: { type: String, default: null },
    completedAt: { type: Date, default: null }
  }],
  error: {
    type: String,
    default: null
  },
  lastErrorDetails: {
    timestamp: { type: Date, default: null },
    endpoint: { type: String, default: '' },
    failedModuleId: { type: String, default: '' },
    moduleOrder: { type: Number, default: null },
    statusCode: { type: Number, default: null },
    backendException: { type: String, default: '' },
    aiProviderError: { type: String, default: '' },
    stack: { type: String, default: '' }
  },
  retryCount: {
    type: Number,
    default: 0
  },
  recoveryStatus: {
    type: String,
    enum: ['none', 'recovering', 'resumed', 'completed_after_recovery'],
    default: 'none'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('SyllabusGenerationJob', syllabusGenerationJobSchema);
