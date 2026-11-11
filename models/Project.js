const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  domain: {
    type: String,
    trim: true,
    default: 'Enterprise Software'
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    default: null,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  technologies: [{ type: String }],
  requirements: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Industry Level'],
    default: 'Intermediate'
  },
  xpReward: {
    type: Number,
    default: 250
  },
  estimatedHours: {
    type: Number,
    default: 20
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  assignedStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  githubRepoUrl: {
    type: String,
    default: ''
  },
  liveDemoUrl: {
    type: String,
    default: ''
  },
  screenshots: [{ type: String }],
  progressPercentage: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Available', 'Active', 'Not Started', 'In Progress', 'Under Review', 'Completed', 'Approved', 'Archived'],
    default: 'Available'
  },
  trainerFeedback: {
    type: String,
    default: ''
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'Pending'],
    default: 'Pending'
  }
}, { timestamps: true });

projectSchema.index({ createdAt: -1 });
projectSchema.index({ category: 1, isActive: 1 });
projectSchema.index({ courseId: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
