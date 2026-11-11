const mongoose = require('mongoose');

const trainingInterviewSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  collegeTrainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTraining'
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  collegeName: {
    type: String,
    required: true
  },
  trainingName: {
    type: String,
    required: true
  },
  batchName: {
    type: String,
    default: ''
  },
  interviewDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  round: {
    type: String,
    default: 'Technical Round'
  },
  interviewer: {
    type: String,
    default: 'Senior Technical Lead'
  },
  result: {
    type: String,
    enum: ['Passed', 'Failed', 'Pending'],
    default: 'Pending'
  },
  score: {
    type: String,
    default: '85/100'
  },
  adminFeedback: {
    type: String,
    default: ''
  },
  failureReason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Completed'
  }
}, { timestamps: true });

module.exports = mongoose.model('TrainingInterview', trainingInterviewSchema);
