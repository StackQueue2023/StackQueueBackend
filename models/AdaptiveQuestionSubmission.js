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
    enum: ['coding', 'mcq', 'practical', 'descriptive', 'scenario', 'objective', 'subjective_rubric'],
    required: true,
    index: true
  },
  selectedOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D', ''],
    default: ''
  },
  submittedAnswer: {
    type: String,
    default: ''
  },
  scenarioResponse: {
    problemIdentification: { type: String, default: '' },
    reasoning: { type: String, default: '' },
    proposedSolution: { type: String, default: '' }
  },
  submittedCode: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: ''
  },
  stateData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  evaluationStatus: {
    type: String,
    enum: ['Passed', 'Failed', 'Partially Correct', 'Instructor Review Required'],
    default: 'Failed',
    index: true
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    default: 10
  },
  percentage: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  missingConcepts: [{
    type: String
  }],
  identifiedConcepts: [{
    type: String
  }],
  correctionGuidance: {
    type: String,
    default: ''
  },
  evaluationEvidence: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  instructorReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    overrideMarks: { type: Number, default: null },
    overrideStatus: { type: String, enum: ['Passed', 'Failed', 'Partially Correct', null], default: null },
    reason: { type: String, default: '' }
  },
  retryAllowed: {
    type: Boolean,
    default: true
  },
  evaluationResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
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
