const mongoose = require('mongoose');

const monthlyInstallmentSchema = new mongoose.Schema({
  installmentId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  feePlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeePlan',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentCode: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Courses', 'College Training', 'Internships', 'Projects'],
    required: true,
    index: true
  },
  programName: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  domain: {
    type: String,
    trim: true,
    default: ''
  },
  installmentNumber: {
    type: Number,
    required: true,
    min: 1
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  principalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeeAccrued: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeePaid: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeeWaived: {
    type: Number,
    default: 0,
    min: 0
  },
  overdueDays: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Pending', 'Unpaid'],
    default: 'Pending',
    index: true
  },
  lastReminderDate: {
    type: Date
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  tutorNotified: {
    type: Boolean,
    default: false
  },
  tutorNotifiedDate: {
    type: Date
  },
  isDummy: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

// Virtuals for pending amounts
monthlyInstallmentSchema.virtual('principalPending').get(function () {
  return Math.max(0, (this.principalAmount || 0) - (this.principalPaid || 0));
});

monthlyInstallmentSchema.virtual('lateFeePending').get(function () {
  return Math.max(0, (this.lateFeeAccrued || 0) - (this.lateFeePaid || 0) - (this.lateFeeWaived || 0));
});

monthlyInstallmentSchema.virtual('totalAmountDue').get(function () {
  const pPending = Math.max(0, (this.principalAmount || 0) - (this.principalPaid || 0));
  const lPending = Math.max(0, (this.lateFeeAccrued || 0) - (this.lateFeePaid || 0) - (this.lateFeeWaived || 0));
  return pPending + lPending;
});

monthlyInstallmentSchema.set('toJSON', { virtuals: true });
monthlyInstallmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MonthlyInstallment', monthlyInstallmentSchema);
