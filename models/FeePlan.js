const mongoose = require('mongoose');

const feePlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
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
    required: true,
    trim: true
  },
  studentCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  studentEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    enum: ['Courses', 'College Training', 'Internships', 'Projects'],
    required: true,
    index: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
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
  programName: {
    type: String,
    required: true,
    trim: true
  },
  programCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  collegeName: {
    type: String,
    default: ''
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  batchName: {
    type: String,
    default: ''
  },
  assignedTutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedTutorName: {
    type: String,
    default: 'Institute Senior Mentor'
  },
  assignedTutorEmail: {
    type: String,
    default: ''
  },
  totalAgreedFee: {
    type: Number,
    required: true,
    min: 0
  },
  downPaymentCollected: {
    type: Number,
    default: 0,
    min: 0
  },
  downPaymentDate: {
    type: Date,
    default: null
  },
  downPaymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Net Banking', 'Other', null],
    default: null
  },
  downPaymentTransactionId: {
    type: String,
    default: ''
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  courseDuration: {
    type: String,
    default: '12 Weeks'
  },
  courseDurationValue: {
    type: Number,
    default: 12
  },
  courseDurationUnit: {
    type: String,
    default: 'Weeks'
  },
  totalHours: {
    type: Number,
    default: 120
  },
  durationMonths: {
    type: Number,
    default: 3,
    min: 1
  },
  monthlyInstallmentAmount: {
    type: Number,
    required: true,
    default: 2000,
    min: 0
  },
  numberOfInstallments: {
    type: Number,
    required: true,
    default: 12
  },
  billingFrequency: {
    type: String,
    enum: ['Monthly', 'One-Time', 'Quarterly'],
    default: 'Monthly'
  },
  billingStartDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  monthlyDueDay: {
    type: Number,
    default: 3, // 3rd of each month
    min: 1,
    max: 28
  },
  gracePeriodDays: {
    type: Number,
    default: 5
  },
  dailyLateFeeRate: {
    type: Number,
    default: 0
  },
  maxLateFeeCap: {
    type: Number,
    default: 2000
  },
  paymentTerms: {
    type: String,
    default: 'Installments due on the 3rd of each calendar month with a 5-day grace period.'
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
    default: 'Active',
    index: true
  },
  isDummy: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('FeePlan', feePlanSchema);
