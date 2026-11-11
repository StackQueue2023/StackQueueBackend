const mongoose = require('mongoose');

const projectReviewSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectAssignment',
    required: true,
    index: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectSubmission',
    required: true
  },
  submissionVersion: {
    type: Number,
    required: true
  },
  versionReviewed: {
    type: Number
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String,
    required: [true, 'Tutor remarks/feedback are required']
  },
  missingFeatures: [{
    type: String
  }],
  bugsIdentified: [{
    type: String
  }],
  requiredImprovements: [{
    type: String
  }],
  completedRequirements: [{
    type: String
  }],
  privateEvaluationNotes: {
    type: String,
    default: ''
  },
  testingResults: {
    type: String,
    default: ''
  },
  knownIssues: [{
    type: String
  }],
  decision: {
    type: String,
    enum: ['ApprovedForAdmin', 'RevisionRequired', 'Rejected', 'Approved for Admin', 'Revision Required'],
    required: true
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

projectReviewSchema.pre('validate', function (next) {
  if (!this.tutorId && this.reviewerId) this.tutorId = this.reviewerId;
  if (!this.reviewerId && this.tutorId) this.reviewerId = this.tutorId;
  if (!this.submissionVersion && this.versionReviewed) this.submissionVersion = this.versionReviewed;
  if (!this.versionReviewed && this.submissionVersion) this.versionReviewed = this.submissionVersion;
  next();
});

module.exports = mongoose.model('ProjectReview', projectReviewSchema);
