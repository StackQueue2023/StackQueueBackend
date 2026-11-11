const mongoose = require('mongoose');

const studentLeaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  leaveDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Full Day', 'Half Day'],
    default: 'Full Day'
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalReason: {
    type: String,
    default: ''
  },
  approvedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentLeave', studentLeaveSchema);
