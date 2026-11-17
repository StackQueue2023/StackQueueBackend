const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    index: true
  },
  isDailyOnly: {
    type: Boolean,
    default: false,
    index: true
  },
  domain: {
    type: String,
    default: 'general',
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
    index: true
  },
  problemStatement: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String,
    default: ''
  },
  outputFormat: {
    type: String,
    default: ''
  },
  constraints: {
    type: String,
    default: ''
  },
  examples: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' }
  }],
  starterCode: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' }
  },
  hints: [{
    type: String
  }],
  xp: {
    type: Number,
    default: 10
  },
  timeLimit: {
    type: Number,
    default: 2000 // ms
  },
  memoryLimit: {
    type: Number,
    default: 256 // MB
  },
  tags: [{
    type: String
  }],
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null,
    index: true
  },
  topic: {
    type: String,
    default: ''
  },
  topicId: {
    type: String,
    default: '',
    index: true
  },
  technology: {
    type: String,
    default: '',
    index: true
  },
  programmingLanguage: {
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
  subtopics: [{
    type: String
  }],
  targetFeature: {
    type: String,
    enum: ['INTERVIEW_ARENA', 'MOCK_INTERVIEW', 'MODULE_QUESTIONS', 'MODULE', 'TESTING_PRACTICE', 'DAILY_CHALLENGE', 'GENERAL'],
    default: 'INTERVIEW_ARENA',
    index: true
  },
  questionBankType: {
    type: String,
    enum: ['INTERVIEW_ARENA', 'MOCK_INTERVIEW', 'MODULE', 'DAILY_CHALLENGE'],
    default: 'INTERVIEW_ARENA',
    index: true
  },
  interviewContext: {
    type: String,
    default: ''
  },
  objective: {
    type: String,
    default: ''
  },
  testingSolution: {
    type: String,
    default: ''
  },
  questionType: {
    type: String,
    enum: ['coding', 'conceptual', 'scenario', 'mcq', 'practical', 'descriptive', 'objective', 'subjective_rubric'],
    default: 'coding',
    index: true
  },
  environmentType: {
    type: String,
    default: '',
    index: true
  },
  evaluationMethod: {
    type: String,
    enum: ['objective', 'descriptive', 'practical', 'scenario', 'subjective_rubric', 'compiler'],
    default: 'objective',
    index: true
  },
  expectedAnswer: {
    type: String,
    default: ''
  },
  explanation: {
    type: String,
    default: ''
  },
  mandatoryConcepts: [{
    type: String,
    trim: true
  }],
  acceptedAlternatives: [{
    type: String,
    trim: true
  }],
  negativeConcepts: [{
    type: String,
    trim: true
  }],
  requiredOutcomes: [{
    type: String,
    trim: true
  }],
  requiredWorkspaceElements: [{
    type: String,
    trim: true
  }],
  validationRules: [{
    type: String,
    trim: true
  }],
  evaluationRubric: [{
    criterion: { type: String, required: true },
    weight: { type: Number, default: 1 },
    maxScore: { type: Number, default: 10 },
    description: { type: String, default: '' },
    requiredConcepts: [{ type: String }]
  }],
  maxMarks: {
    type: Number,
    default: 10,
    min: 1
  },
  passingThreshold: {
    type: Number,
    default: 70, // Percentage e.g. 70%
    min: 1,
    max: 100
  },
  reviewMode: {
    type: String,
    enum: ['automatic', 'instructor_review', 'hybrid_uncertain'],
    default: 'automatic',
    index: true
  },
  isVerifiedForPublish: {
    type: Boolean,
    default: false,
    index: true
  },
  testBatteryResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  rubric: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  options: [{
    optionId: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true
    },
    text: {
      type: String,
      required: true
    }
  }],
  correctAnswer: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    default: null
  },
  points: {
    type: Number,
    default: 10,
    min: 1
  },
  theoryAnswer: {
    type: String,
    default: ''
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'tested', 'flagged', 'pending'],
    default: 'verified',
    index: true
  },
  flagReason: {
    type: String,
    default: ''
  },
  flaggedAt: {
    type: Date,
    default: null
  },
  recoveredAt: {
    type: Date,
    default: null
  },
  lastValidatedAt: {
    type: Date,
    default: null
  },
  compilerError: {
    type: String,
    default: null
  },
  failedTestCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    error: { type: String, default: '' }
  }],
  manualReviewStatus: {
    type: String,
    enum: ['NONE', 'OVERRIDDEN', 'APPROVED', 'REJECTED'],
    default: 'NONE'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  auditHistory: [{
    action: {
      type: String,
      enum: ['EDIT', 'DELETE', 'FLAG', 'RECOVER', 'REVALIDATE', 'ADMIN_OVERRIDE'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    performedByName: {
      type: String,
      default: 'Admin'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: ''
    },
    previousStatus: {
      type: String,
      default: ''
    },
    newStatus: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  referenceSolution: {
    type: String,
    default: ''
  },
  explanation: {
    type: String,
    default: ''
  },
  keyConcepts: [{
    type: String
  }],
  evaluationCriteria: {
    type: String,
    default: ''
  },
  isTested: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
