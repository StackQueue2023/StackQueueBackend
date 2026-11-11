const mongoose = require('mongoose');

const projectDailyProgressSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TutorProject',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  dailyGoal: {
    type: String,
    default: ''
  },
  completedToday: {
    type: String,
    default: ''
  },
  flowCompleted: {
    type: [String],
    default: []
  },
  problemsFaced: {
    type: String,
    default: ''
  },
  solutionImplemented: {
    type: String,
    default: ''
  },
  nextStep: {
    type: String,
    default: ''
  },
  testingDone: {
    type: String,
    default: ''
  },
  progressPercentage: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('ProjectDailyProgress', projectDailyProgressSchema);
