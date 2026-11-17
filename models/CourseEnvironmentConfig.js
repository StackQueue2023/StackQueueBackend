const mongoose = require('mongoose');

const courseEnvironmentConfigSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    unique: true,
    index: true
  },
  courseSlug: {
    type: String,
    required: true,
    index: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'CATEGORY_A_AI_DATA',
      'CATEGORY_B_WEB_FULLSTACK',
      'CATEGORY_C_CLOUD_DEVOPS_CYBER',
      'CATEGORY_D_MOBILE_UIUX',
      'CATEGORY_E_TESTING',
      'CATEGORY_F_BLOCKCHAIN_API_DB',
      'CATEGORY_G_LANGUAGES',
      'CATEGORY_H_CAD_MECHANICAL'
    ],
    required: true,
    index: true
  },
  categoryLabel: {
    type: String,
    required: true
  },
  classification: {
    type: String,
    enum: ['coding', 'non-coding', 'hybrid'],
    required: true,
    index: true
  },
  environmentType: {
    type: String,
    required: true
  },
  environmentName: {
    type: String,
    required: true
  },
  compilerLanguage: {
    type: String,
    default: null
  },
  supportedLanguages: [{
    type: String
  }],
  workspaceTools: [{
    toolId: String,
    toolName: String,
    icon: String,
    description: String
  }],
  validationStrategy: {
    type: String,
    enum: [
      'COMPILER_TEST_CASES',
      'UIUX_DOM_RUBRIC',
      'CAD_GEOMETRY_EVAL',
      'CLOUD_ARCH_EVAL',
      'MANUAL_TESTING_EVAL',
      'DATA_ANALYTICS_EVAL',
      'RPA_WORKFLOW_EVAL',
      'CYBER_DEFENSE_EVAL',
      'SQL_DATASET_COMPARE',
      'MCQ_OPTIONS_CHECK'
    ],
    required: true
  },
  starterTemplate: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  evaluationCriteria: [{
    criterionId: String,
    label: String,
    weightPercent: Number,
    isAutomated: Boolean,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

courseEnvironmentConfigSchema.index({ category: 1, classification: 1 });
courseEnvironmentConfigSchema.index({ environmentType: 1 });

module.exports = mongoose.model('CourseEnvironmentConfig', courseEnvironmentConfigSchema);
