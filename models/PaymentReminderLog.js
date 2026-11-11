const mongoose = require('mongoose');

const paymentReminderLogSchema = new mongoose.Schema({
  reminderId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  installmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyInstallment',
    index: true
  },
  feePlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeePlan',
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientEmail: {
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['Student', 'Tutor', 'Admin'],
    default: 'Student'
  },
  category: {
    type: String,
    enum: ['Courses', 'College Training', 'Internships', 'Projects'],
    default: 'Courses'
  },
  programName: {
    type: String,
    default: ''
  },
  reminderType: {
    type: String,
    enum: [
      'Monthly Pre-Due',
      'Due Date Reminder',
      'Payment Follow-Up',
      'Fee Reminder',
      'Payment Verification Notice',
      'Payment Receipt',
      'Overdue Notice',
      'Tutor Escalation'
    ],
    required: true
  },
  amountDue: {
    type: Number,
    default: 0
  },
  principalDue: {
    type: Number,
    default: 0
  },
  lateFeeDue: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date
  },
  overdueDays: {
    type: Number,
    default: 0
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['Delivered (Mock Sink)', 'Sent', 'Failed'],
    default: 'Delivered (Mock Sink)'
  },
  subject: {
    type: String,
    required: true
  },
  messageBody: {
    type: String,
    default: ''
  },
  isDummy: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentReminderLog', paymentReminderLogSchema);
