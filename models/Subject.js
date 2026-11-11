const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  description: {
    type: String,
    default: ''
  },
  topics: [{
    title: { type: String, required: true },
    order: { type: Number, default: 1 },
    estimatedHours: { type: Number, default: 4 },
    completedStudentsCount: { type: Number, default: 0 }
  }],
  order: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
