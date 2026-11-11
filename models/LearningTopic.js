const mongoose = require('mongoose');

const learningTopicSchema = new mongoose.Schema({
  learningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TutorLearning',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topicName: {
    type: String,
    required: true
  },
  understandingPercentage: {
    type: Number,
    default: 80
  },
  strengthLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Strong'],
    default: 'Intermediate'
  },
  whatUnderstood: {
    type: String,
    default: ''
  },
  difficulties: {
    type: String,
    default: ''
  },
  practiceCompleted: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('LearningTopic', learningTopicSchema);
