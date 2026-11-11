const mongoose = require('mongoose');

const interviewCorrectiveActionSchema = new mongoose.Schema({
  failureAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewFailureAnalysis',
    required: true,
    index: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingInterview',
    required: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionTaken: {
    type: String,
    required: true
  },
  effectObserved: {
    type: String,
    default: ''
  },
  improvementObserved: {
    type: String,
    default: ''
  },
  confidenceLevel: {
    type: Number, // 1 - 5
    default: 4
  },
  technicalImprovement: {
    type: Number, // 0 - 100%
    default: 80
  },
  communicationImprovement: {
    type: Number, // 0 - 100%
    default: 80
  },
  trainingDeliveryImprovement: {
    type: Number, // 0 - 100%
    default: 80
  },
  resultAfterImprovement: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewCorrectiveAction', interviewCorrectiveActionSchema);
