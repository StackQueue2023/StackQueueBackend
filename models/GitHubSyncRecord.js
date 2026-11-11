const mongoose = require('mongoose');

const gitHubSyncRecordSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectAssignment',
    required: true,
    index: true
  },
  projectRequirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectRequirement'
  },
  studentRepoUrl: {
    type: String,
    required: true
  },
  sourceCommitSha: {
    type: String,
    default: ''
  },
  destinationRepoName: {
    type: String,
    required: true
  },
  destinationRepoUrl: {
    type: String,
    default: ''
  },
  destinationRepoId: {
    type: String,
    default: ''
  },
  destinationOwner: {
    type: String,
    default: ''
  },
  destinationCommitSha: {
    type: String,
    default: ''
  },
  syncedFilesCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'SYNCED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  errorLog: {
    type: String,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  sensitiveFilesDetected: [{
    type: String
  }],
  lastAttemptAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('GitHubSyncRecord', gitHubSyncRecordSchema);
