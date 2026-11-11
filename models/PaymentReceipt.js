const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentTransaction',
    required: true,
    index: true
  },
  installmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyInstallment'
  },
  feePlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeePlan'
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
  studentEmail: {
    type: String,
    default: ''
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
  amountReceived: {
    type: Number,
    required: true
  },
  principalAmount: {
    type: Number,
    required: true
  },
  lateFeeAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  paymentReference: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  remainingPrincipal: {
    type: Number,
    default: 0
  },
  outstandingLateFees: {
    type: Number,
    default: 0
  },
  totalAmountPayable: {
    type: Number,
    default: 0
  },
  nextDueDate: {
    type: Date
  },
  issuedBy: {
    type: String,
    default: 'STACK QUEUE Accounts & Finance Division'
  },
  isDummy: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentReceipt', paymentReceiptSchema);
