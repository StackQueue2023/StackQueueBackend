const mongoose = require('mongoose');

const projectAssignmentSchema = new mongoose.Schema({
  projectRequirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectRequirement',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignmentDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  studentDeadline: {
    type: Date
  },
  tutorInstructions: {
    type: String,
    default: ''
  },
  expectedDeliverables: [{
    type: String
  }],
  status: {
    type: String,
    enum: [
      'Assigned',
      'In Progress',
      'Submitted',
      'Tutor Review',
      'Revision Required',
      'Resubmitted',
      'Sent for Admin Approval',
      'Approved',
      'Rejected'
    ],
    default: 'Assigned',
    index: true
  },
  activeSubmissionVersion: {
    type: Number,
    default: 0
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedCommitSha: {
    type: String,
    default: ''
  },
  approvedCommitSha: {
    type: String,
    default: ''
  },
  approvedGitHubRepoUrl: {
    type: String,
    default: ''
  },
  liveDemoUrl: {
    type: String,
    default: ''
  },
  submittedToAdminAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  // Public Homepage & Library Promotion
  isPublishedToHomepage: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: {
    type: Date
  },
  // GitHub Sync State
  syncedToGithub: {
    type: Boolean,
    default: false
  },
  githubSyncStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'SYNCED', 'FAILED'],
    default: 'NONE',
    index: true
  },
  destinationGithubRepoUrl: {
    type: String,
    default: ''
  },
  destinationRepoName: {
    type: String,
    default: ''
  },
  destinationCommitSha: {
    type: String,
    default: ''
  },
  syncError: {
    type: String,
    default: ''
  },
  githubSyncError: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Ensure deadline and studentDeadline sync
projectAssignmentSchema.pre('save', function (next) {
  if (!this.deadline && this.studentDeadline) {
    this.deadline = this.studentDeadline;
  }
  if (!this.studentDeadline && this.deadline) {
    this.studentDeadline = this.deadline;
  }
  if (!this.activeSubmissionVersion && this.currentVersion) {
    this.activeSubmissionVersion = this.currentVersion;
  }
  if (!this.currentVersion && this.activeSubmissionVersion) {
    this.currentVersion = this.activeSubmissionVersion;
  }
  next();
});

// Ensure one active assignment per student per requirement
projectAssignmentSchema.index({ projectRequirementId: 1, studentId: 1 }, { unique: true });
projectAssignmentSchema.index({ studentId: 1, status: 1 });
projectAssignmentSchema.index({ tutorId: 1, status: 1 });
projectAssignmentSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('ProjectAssignment', projectAssignmentSchema);
