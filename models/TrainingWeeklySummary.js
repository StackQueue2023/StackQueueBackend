const mongoose = require('mongoose');

const trainingWeeklySummarySchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  weekStart: {
    type: String, // YYYY-MM-DD (Monday)
    required: true
  },
  weekEnd: {
    type: String, // YYYY-MM-DD (Sunday)
    required: true
  },
  totalStudents: { type: Number, default: 0 },
  totalTasksAssigned: { type: Number, default: 0 },
  totalTasksCompleted: { type: Number, default: 0 },
  totalTasksPending: { type: Number, default: 0 },
  weeklyCompletionPercent: { type: Number, default: 0 },
  weeklyAttendancePercent: { type: Number, default: 0 },
  studentBreakdown: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    department: String,
    year: String,
    tasksAssigned: Number,
    tasksCompleted: Number,
    tasksPending: Number,
    completionPercent: Number,
    daysPresent: Number,
    totalDays: Number,
    attendancePercent: Number
  }],
  dailyTaskBreakdown: [{
    date: String,
    assigned: Number,
    completed: Number,
    pending: Number,
    completionPercent: Number
  }],
  dailyAttendanceBreakdown: [{
    date: String,
    present: Number,
    absent: Number,
    total: Number,
    attendancePercent: Number
  }],
  completedAllStudents: [{ type: String }],
  pendingStudents: [{ type: String }],
  topPerformers: [{
    name: String,
    completionPercent: Number,
    attendancePercent: Number
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

trainingWeeklySummarySchema.index({ batchId: 1, weekStart: 1, weekEnd: 1 }, { unique: true });

module.exports = mongoose.model('TrainingWeeklySummary', trainingWeeklySummarySchema);
