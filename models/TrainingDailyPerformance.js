const mongoose = require('mongoose');

const trainingDailyPerformanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  assignedTasksCount: {
    type: Number,
    default: 0
  },
  completedTasksCount: {
    type: Number,
    default: 0
  },
  pendingTasksCount: {
    type: Number,
    default: 0
  },
  dailyCompletionPercent: {
    type: Number,
    default: 0
  },
  attendanceStatus: {
    type: String,
    enum: ['present', 'absent', 'late', 'unmarked'],
    default: 'unmarked'
  },
  dailyOverallScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

trainingDailyPerformanceSchema.index({ studentId: 1, batchId: 1, date: 1 }, { unique: true });
trainingDailyPerformanceSchema.index({ batchId: 1, date: 1 });

module.exports = mongoose.model('TrainingDailyPerformance', trainingDailyPerformanceSchema);
