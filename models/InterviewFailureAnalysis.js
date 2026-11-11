const mongoose = require('mongoose');

const interviewFailureAnalysisSchema = new mongoose.Schema({
  interviewId: {
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
  failureReason: {
    type: String,
    required: true
  },
  improvementPlan: {
    type: String,
    required: true
  },
  topicsToImprove: {
    type: String,
    default: ''
  },
  practicePlanned: {
    type: String,
    default: ''
  },
  resourcesUsed: {
    type: String,
    default: ''
  },
  targetCompletionDate: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewFailureAnalysis', interviewFailureAnalysisSchema);
