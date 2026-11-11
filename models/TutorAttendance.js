const mongoose = require('mongoose');

const tutorAttendanceSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  checkIn: {
    type: String,
    default: ''
  },
  checkOut: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Present'
  }
}, { timestamps: true });

tutorAttendanceSchema.index({ date: 1, tutorId: 1 }, { unique: true });

module.exports = mongoose.model('TutorAttendance', tutorAttendanceSchema);
