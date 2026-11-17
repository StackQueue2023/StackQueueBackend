const mongoose = require('mongoose');

const internshipBatchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  batchCode: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Internship course / domain is required'],
    trim: true,
    default: 'General Software Engineering'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  googleSheetUrl: {
    type: String,
    required: [true, 'Google Sheet URL is required'],
    trim: true
  },
  googleSheetId: {
    type: String,
    trim: true
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalStudents: {
    type: Number,
    default: 0
  },
  totalDays: {
    type: Number,
    default: 15
  },
  syllabusPdfUrl: {
    type: String,
    default: ''
  },
  syllabusFileName: {
    type: String,
    default: ''
  },
  totalExpectedFees: {
    type: Number,
    default: 0
  },
  totalCollectedFees: {
    type: Number,
    default: 0
  },
  totalPendingFees: {
    type: Number,
    default: 0
  },
  fullyPaidCount: {
    type: Number,
    default: 0
  },
  partiallyPaidCount: {
    type: Number,
    default: 0
  },
  unpaidCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  importHistory: [{
    importedAt: {
      type: Date,
      default: Date.now
    },
    rowsCount: Number,
    newStudentsCount: Number,
    existingUpdatedCount: Number,
    googleSheetUrl: String
  }]
}, { timestamps: true });

internshipBatchSchema.index({ googleSheetId: 1 });

module.exports = mongoose.model('InternshipBatch', internshipBatchSchema);
