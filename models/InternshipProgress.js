const mongoose = require('mongoose');

const internshipProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  internshipStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipStudent',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipBatch',
    required: true,
    index: true
  },
  dayNumber: {
    type: Number,
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipModule',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipQuestion'
    },
    answer: String,
    isCorrect: Boolean,
    score: Number,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedExercises: [{
    type: String
  }],
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

internshipProgressSchema.index({ studentId: 1, batchId: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('InternshipProgress', internshipProgressSchema);
