const mongoose = require('mongoose');

const tutorLearningSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  learningType: {
    type: String,
    enum: [
      'Learning a New Course',
      'Improving Existing Skills',
      'Working on a Project',
      'Interview Preparation',
      'Technical Practice',
      'Other'
    ],
    default: 'Learning a New Course'
  },
  courseName: {
    type: String,
    required: true
  },
  technology: {
    type: String,
    default: ''
  },
  startDate: {
    type: String
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  summary: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number, // 1 - 5
    default: 4
  },
  hoursSpent: {
    type: Number,
    default: 2
  },
  nextLearningGoal: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('TutorLearning', tutorLearningSchema);
