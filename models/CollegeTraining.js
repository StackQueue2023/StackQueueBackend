const mongoose = require('mongoose');

const collegeTrainingSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  collegeName: {
    type: String,
    required: true,
    trim: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  batchName: {
    type: String,
    required: true,
    trim: true
  },
  trainingName: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    default: 10,
    required: true
  },
  totalStudents: {
    type: Number,
    default: 28,
    required: true
  },
  currentDay: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
    default: 'ACTIVE',
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CollegeTraining', collegeTrainingSchema);
