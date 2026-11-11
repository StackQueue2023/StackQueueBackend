const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['student', 'trainer', 'college_batch'],
    default: 'student'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept'
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Leave', 'PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'PENDING'],
    default: 'Present'
  },
  absenceReason: {
    type: String,
    enum: [
      'Medical Leave',
      'Personal Reason',
      'College Work',
      'Travel',
      'Emergency',
      'Technical Issue',
      'Other'
    ]
  },
  absenceDescription: {
    type: String,
    default: ''
  },
  absenceSubmittedAt: {
    type: Date
  },
  remarks: {
    type: String,
    default: ''
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

attendanceSchema.index({ date: 1, userId: 1, batchId: 1 }, { unique: true });
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ batchId: 1, date: -1 });
attendanceSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
