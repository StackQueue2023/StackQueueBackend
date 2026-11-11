const mongoose = require('mongoose');

const tutorProjectSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectName: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    default: 'Full Stack Web App'
  },
  technologyStack: {
    type: String,
    default: 'MERN Stack'
  },
  startDate: {
    type: String
  },
  status: {
    type: String,
    enum: ['Planning', 'Development', 'Testing', 'Completed'],
    default: 'Development'
  },
  progressPercentage: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('TutorProject', tutorProjectSchema);
