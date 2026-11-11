const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: [
      'Medical Leave',
      'Personal Reason',
      'College Work',
      'Travel',
      'Emergency',
      'Technical Issue',
      'Other'
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewRemarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

leaveRequestSchema.index({ studentId: 1, sessionId: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
