const mongoose = require('mongoose');

const workspaceStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  questionId: {
    type: String, // String or ObjectId for DomainTask or InterviewQuestion
    required: true,
    index: true
  },
  environmentType: {
    type: String,
    required: true
  },
  stateData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastExecutedAt: {
    type: Date,
    default: null
  },
  lastExecutionResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

workspaceStateSchema.index({ userId: 1, courseId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceState', workspaceStateSchema);
