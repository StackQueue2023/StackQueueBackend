const mongoose = require('mongoose');

const studentTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  attachment: {
    type: String,
    default: ''
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLETED'],
    default: 'ASSIGNED',
    index: true
  },
  submission: {
    textAnswer: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    submittedAt: { type: Date }
  },
  reviewedAt: {
    type: Date
  },
  tutorFeedback: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  xpAwarded: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentTask', studentTaskSchema);
