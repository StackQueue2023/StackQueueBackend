const mongoose = require('mongoose');

const projectSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectAssignment',
    required: true,
    index: true
  },
  projectRequirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectRequirement',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true,
    default: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  implementationNotes: {
    type: String,
    default: ''
  },
  githubRepoUrl: {
    type: String,
    required: [true, 'GitHub repository URL is required'],
    trim: true
  },
  liveDemoUrl: {
    type: String,
    default: '',
    trim: true
  },
  commitSha: {
    type: String,
    default: ''
  },
  supportingDocuments: [{
    originalName: { type: String },
    filename: { type: String },
    url: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }],
  screenshots: [{
    originalName: { type: String },
    filename: { type: String },
    url: { type: String }
  }],
  submissionComments: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'Submitted',
      'Tutor Review',
      'Revision Required',
      'Resubmitted',
      'Sent for Admin Approval',
      'Approved',
      'Rejected'
    ],
    default: 'Submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  projectTitle: {
    type: String,
    default: ''
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

projectSubmissionSchema.pre('save', function (next) {
  if (!this.title && this.projectTitle) this.title = this.projectTitle;
  if (!this.projectTitle && this.title) this.projectTitle = this.title;
  next();
});

projectSubmissionSchema.index({ assignmentId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('ProjectSubmission', projectSubmissionSchema);
