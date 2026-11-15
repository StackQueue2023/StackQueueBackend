const mongoose = require('mongoose');

const collegeTrainingQuestionSchema = new mongoose.Schema({
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
  syllabusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTrainingSyllabus',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTrainingModule',
    required: true,
    index: true
  },
  unitNumber: {
    type: Number,
    default: 1
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['coding', 'mcq', 'debugging', 'conceptual'],
    default: 'coding',
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  instructions: {
    type: String,
    required: true
  },
  starterCode: {
    type: String,
    default: ''
  },
  solutionCode: {
    type: String,
    default: ''
  },
  testCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }
  }],
  mcqOptions: [{
    optionId: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  correctOptionId: {
    type: String,
    default: ''
  },
  explanation: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

collegeTrainingQuestionSchema.index({ moduleId: 1, order: 1 });
collegeTrainingQuestionSchema.index({ batchId: 1, type: 1 });

module.exports = mongoose.model('CollegeTrainingQuestion', collegeTrainingQuestionSchema);
