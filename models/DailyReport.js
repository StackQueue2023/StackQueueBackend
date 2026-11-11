const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  topicCovered: {
    type: String,
    required: true
  },
  practicalActivity: {
    type: String,
    required: true
  },
  studentAttendanceCount: {
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  studentPerformanceSummary: {
    type: String,
    default: 'Good engagement and completed hands-on challenges.'
  },
  assignmentsGiven: {
    type: String,
    default: ''
  },
  challengesAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  issuesEncountered: {
    type: String,
    default: 'None'
  },
  trainerRemarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

dailyReportSchema.index({ date: 1, batchId: 1 }, { unique: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
