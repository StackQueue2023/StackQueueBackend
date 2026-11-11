const mongoose = require('mongoose');

const tutorImprovementUpdateSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingInterview',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  improvementAction: {
    type: String,
    default: ''
  },
  topicsImproved: {
    type: String,
    default: ''
  },
  practiceCompleted: {
    type: String,
    default: ''
  },
  actionBasedOnFeedback: {
    type: String,
    default: ''
  },
  improvementStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'In Progress'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  adminReviewed: {
    type: Boolean,
    default: false
  },
  adminFollowUpFeedback: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('TutorImprovementUpdate', tutorImprovementUpdateSchema);
