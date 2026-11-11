const mongoose = require('mongoose');

const batchDailyReportSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  pdfPath: {
    type: String,
    required: true
  },
  statsSnapshot: {
    totalStudents: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    avgPointsToday: { type: Number, default: 0 },
    totalTasksCompletedToday: { type: Number, default: 0 }
  },
  topicCovered: {
    type: String,
    default: ''
  },
  practicalActivity: {
    type: String,
    default: ''
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

batchDailyReportSchema.index({ batchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BatchDailyReport', batchDailyReportSchema);
