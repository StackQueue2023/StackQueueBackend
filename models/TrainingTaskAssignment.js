const mongoose = require('mongoose');

const trainingTaskAssignmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    trim: true,
    default: 'General Training'
  },
  assignedDate: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  dueDate: {
    type: String // YYYY-MM-DD
  },
  status: {
    type: String,
    enum: ['assigned', 'completed'],
    default: 'assigned',
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  points: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

trainingTaskAssignmentSchema.index({ studentId: 1, assignedDate: 1 });
trainingTaskAssignmentSchema.index({ batchId: 1, assignedDate: 1 });
trainingTaskAssignmentSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('TrainingTaskAssignment', trainingTaskAssignmentSchema);
