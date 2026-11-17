const mongoose = require('mongoose');

const internshipQuestionSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipBatch',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipModule',
    required: true,
    index: true
  },
  dayNumber: {
    type: Number,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['coding', 'mcq', 'practical', 'short_answer'],
    default: 'coding'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    default: ''
  },
  explanation: {
    type: String,
    default: ''
  },
  codeTemplate: {
    type: String,
    default: ''
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  order: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

internshipQuestionSchema.index({ batchId: 1, dayNumber: 1, order: 1 });

module.exports = mongoose.model('InternshipQuestion', internshipQuestionSchema);
