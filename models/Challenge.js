const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String },
  label: { type: String },
  nodeType: { type: String },
  icon: { type: String }
}, { _id: false });

const connectionSchema = new mongoose.Schema({
  from: { type: String },
  to: { type: String }
}, { _id: false });

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  gameSlug: {
    type: String,
    required: true,
    index: true
  },
  levelNumber: {
    type: Number,
    default: 1
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  type: {
    type: String,
    enum: [
      'css_rendering',
      'mcq',
      'output_prediction',
      'code_completion',
      'debugging',
      'code_ordering',
      'visual_dsa',
      'algo_viz',
      'sql_query',
      'git_scenario',
      'cloud_arch',
      'fullstack_mission',
      'coding_challenge'
    ],
    required: true
  },
  language: {
    type: String,
    default: 'javascript'
  },
  runtime: {
    type: String,
    default: 'Node.js'
  },
  evaluationType: {
    type: String,
    enum: ['output_test_cases', 'function_test_cases', 'dom_rendering', 'custom_evaluator'],
    default: 'output_test_cases'
  },
  instructions: {
    type: String,
    required: true
  },
  targetDescription: {
    type: String,
    default: ''
  },
  starterCode: {
    type: String,
    default: ''
  },
  solutionCode: {
    type: String,
    default: ''
  },
  targetCondition: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  initialHtml: {
    type: String,
    default: ''
  },
  expectedOutput: {
    type: String,
    default: ''
  },
  testCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    explanation: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }
  }],
  mcqOptions: [{
    id: { type: String },
    text: { type: String },
    isCorrect: { type: Boolean, default: false }
  }],
  codeBlocks: [{
    id: { type: String },
    code: { type: String },
    correctOrder: { type: Number }
  }],
  gitScenario: {
    initialGraph: [{ id: String, label: String, branch: String }],
    targetGoal: { type: String },
    availableCommands: [{ type: String }]
  },
  cloudArchitecture: {
    availableNodes: [nodeSchema],
    requiredConnections: [connectionSchema]
  },
  hints: [{
    hintText: { type: String, required: true },
    xpPenalty: { type: Number, default: 5 }
  }],
  xpReward: {
    type: Number,
    default: 20
  },
  timeLimitSeconds: {
    type: Number,
    default: 120
  },
  order: {
    type: Number,
    default: 1
  },
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
  domain: {
    type: String,
    default: 'general',
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
  targetFeature: {
    type: String,
    default: 'GAME_HUB',
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'tested', 'flagged', 'pending'],
    default: 'verified',
    index: true
  },
  explanation: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
