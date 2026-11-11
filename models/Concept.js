const mongoose = require('mongoose');

const conceptSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
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
  order: {
    type: Number,
    default: 1
  },
  assignedTutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  tutorStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'NOT_STARTED',
    index: true
  },
  tutorCompletedAt: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

conceptSchema.index({ moduleId: 1, order: 1 });
conceptSchema.index({ courseId: 1, tutorStatus: 1 });

module.exports = mongoose.model('Concept', conceptSchema);
