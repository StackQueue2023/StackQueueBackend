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
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
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
    interviewArenaCount: { type: Number, default: 0 },
    gameHubCount: { type: Number, default: 0 },
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
    error: { type: String, default: null }
  }],
  error: {
    type: String,
    default: null
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
