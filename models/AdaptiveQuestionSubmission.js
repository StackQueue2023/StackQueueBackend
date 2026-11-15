const mongoose = require('mongoose');

const adaptiveQuestionSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestion',
    required: true,
    index: true
  },
  questionType: {
    type: String,
    enum: ['coding', 'mcq'],
    required: true,
    index: true
  },
  selectedOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D', ''],
    default: ''
  },
  submittedCode: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: ''
  },
  isCorrect: {
    type: Boolean,
    required: true,
    index: true
  },
  pointsAwarded: {
    type: Number,
    default: 0,
    min: 0
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate evaluation and point awards per student per question per course
adaptiveQuestionSubmissionSchema.index({ studentId: 1, courseId: 1, questionId: 1 }, { unique: true });
adaptiveQuestionSubmissionSchema.index({ courseId: 1, studentId: 1, isCorrect: 1 });
adaptiveQuestionSubmissionSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('AdaptiveQuestionSubmission', adaptiveQuestionSubmissionSchema);
