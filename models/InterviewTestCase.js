const mongoose = require('mongoose');

const interviewTestCaseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestion',
    required: true,
    index: true
  },
  questionNumber: {
    type: Number,
    required: true,
    index: true
  },
  input: {
    type: String,
    default: ''
  },
  expectedOutput: {
    type: String,
    default: ''
  },
  isHidden: {
    type: Boolean,
    default: false,
    index: true
  },
  explanation: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewTestCase', interviewTestCaseSchema);
