const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  transactionId: {
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
    required: false,
    default: null,
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
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  principalAllocated: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeeAllocated: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cash', 'Cheque', 'Net Banking'],
    default: 'UPI'
  },
  referenceId: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Recorded', 'Pending Verification', 'Verified', 'Rejected', 'Reversed'],
    default: 'Verified',
    index: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedByName: {
    type: String,
    default: 'System Administrator'
  },
  recordedByRole: {
    type: String,
    enum: ['admin', 'tutor', 'trainer', 'student', 'system'],
    default: 'admin'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedByName: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date
  },
  receiptNumber: {
    type: String,
    default: ''
  },
  proofUrl: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  isDummy: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
