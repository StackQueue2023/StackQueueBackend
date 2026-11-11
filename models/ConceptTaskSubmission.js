const mongoose = require('mongoose');

const conceptTaskSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConceptTask',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUBMITTED', 'COMPLETED'],
    default: 'COMPLETED',
    index: true
  },
  codeAnswer: {
    type: String,
    default: ''
  },
  output: {
    type: String,
    default: ''
  },
  marksAwarded: {
    type: Number,
    default: 10
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

conceptTaskSubmissionSchema.index({ studentId: 1, taskId: 1 }, { unique: true });
conceptTaskSubmissionSchema.index({ studentId: 1, conceptId: 1 });

module.exports = mongoose.model('ConceptTaskSubmission', conceptTaskSubmissionSchema);
