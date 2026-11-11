const mongoose = require('mongoose');

const reInterviewSchema = new mongoose.Schema({
  previousInterviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingInterview',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTraining'
  },
  scheduledDate: {
    type: String,
    required: true
  },
  round: {
    type: String,
    default: 'Re-Interview Technical Round'
  },
  result: {
    type: String,
    enum: ['Passed', 'Failed', 'Pending'],
    default: 'Pending'
  },
  score: {
    type: String,
    default: ''
  },
  adminFeedback: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('ReInterview', reInterviewSchema);
