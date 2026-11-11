const mongoose = require('mongoose');

const projectRequirementSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Project category/domain is required'],
    default: 'Enterprise Software'
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  problemStatement: {
    type: String,
    required: [true, 'Problem statement is required']
  },
  objectives: [{
    type: String
  }],
  requiredFeatures: [{
    id: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    isMandatory: { type: Boolean, default: true }
  }],
  technicalRequirements: {
    type: String,
    default: ''
  },
  technologies: [{
    type: String
  }],
  expectedOutput: {
    type: String,
    default: ''
  },
  uiUxRequirements: {
    type: String,
    default: ''
  },
  guidelines: {
    type: String,
    default: ''
  },
  referenceFiles: [{
    originalName: { type: String },
    filename: { type: String },
    url: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }],
  thumbnailUrl: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Industry Level'],
    default: 'Intermediate'
  },
  evaluationCriteria: [{
    criterion: { type: String, required: true },
    weightage: { type: Number, default: 20 },
    description: { type: String }
  }],
  referenceGithubUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Published'
  },
  assignedTutors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('ProjectRequirement', projectRequirementSchema);
