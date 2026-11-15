const mongoose = require('mongoose');

const collegeTrainingStudentProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTrainingModule',
    required: true,
    index: true
  },
  completedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeTrainingQuestion',
      required: true
    },
    type: {
      type: String,
      default: 'coding'
    },
    passed: {
      type: Boolean,
      default: true
    },
    submittedCode: {
      type: String,
      default: ''
    },
    selectedOptionId: {
      type: String,
      default: ''
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalQuestionsCount: {
    type: Number,
    default: 0
  },
  completedQuestionsCount: {
    type: Number,
    default: 0
  },
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'NOT_STARTED',
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

collegeTrainingStudentProgressSchema.index(
  { studentId: 1, batchId: 1, moduleId: 1 },
  { unique: true }
);

module.exports = mongoose.model('CollegeTrainingStudentProgress', collegeTrainingStudentProgressSchema);
