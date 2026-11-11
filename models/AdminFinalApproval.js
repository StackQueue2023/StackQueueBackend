const mongoose = require('mongoose');

const adminFinalApprovalSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectAssignment',
    required: true,
    index: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectSubmission'
  },
  submissionVersion: {
    type: Number,
    default: 1
  },
  approvedVersionNumber: {
    type: Number
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  decision: {
    type: String,
    enum: ['Approved', 'Rejected', 'RevisionRequired', 'Revision Required'],
    required: true
  },
  awardedXp: {
    type: Number,
    default: 500
  },
  approvedForHomepage: {
    type: Boolean,
    default: true
  },
  adminFeedback: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  testingResults: {
    type: String,
    default: ''
  },
  approvedCommitSha: {
    type: String,
    default: ''
  },
  decidedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

adminFinalApprovalSchema.pre('validate', function (next) {
  if (!this.submissionVersion && this.approvedVersionNumber) {
    this.submissionVersion = this.approvedVersionNumber;
  }
  if (!this.approvedVersionNumber && this.submissionVersion) {
    this.approvedVersionNumber = this.submissionVersion;
  }
  next();
});

module.exports = mongoose.model('AdminFinalApproval', adminFinalApprovalSchema);
