const mongoose = require('mongoose');

// 1. College Payment Transactions (Incoming Ledger)
const collegePaymentTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Bank Transfer', 'NEFT/RTGS', 'UPI', 'Cheque', 'Cash', 'Other'],
    default: 'Bank Transfer'
  },
  transactionReference: {
    type: String,
    default: ''
  },
  bankUpiReference: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  receiptUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Verified', 'Pending', 'Rejected'],
    default: 'Verified'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// 2. Trainer Payment Transactions (Outgoing Ledger)
const trainerPaymentTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trainerName: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Bank Transfer', 'NEFT/RTGS', 'UPI', 'Cheque', 'Cash', 'Other'],
    default: 'Bank Transfer'
  },
  transactionReference: {
    type: String,
    default: ''
  },
  bankUpiReference: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  receiptUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Verified', 'Pending', 'Rejected'],
    default: 'Verified'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// 3. Admin Financial Email Configuration
const collegeFinancialConfigSchema = new mongoose.Schema({
  primaryEmail: {
    type: String,
    default: 'stackqueue2023@gmail.com'
  },
  ccEmails: [{
    type: String
  }],
  autoEmailReports: {
    type: Boolean,
    default: true
  },
  reportFormat: {
    type: String,
    default: 'PDF'
  }
}, { timestamps: true });

// 4. Batch Financial Reports (Versions & Snapshots)
const collegeFinancialReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  version: {
    type: String,
    required: true
  },
  triggerEvent: {
    type: String,
    enum: ['COLLEGE_PAYMENT', 'TRAINER_PAYMENT', 'EXPENSE_ADDED', 'MANUAL_GENERATION', 'INITIAL'],
    default: 'INITIAL'
  },
  transactionId: {
    type: String,
    default: ''
  },
  pdfPath: {
    type: String,
    default: ''
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  summarySnapshot: {
    collegeName: String,
    batchName: String,
    batchCode: String,
    department: String,
    courseTitle: String,
    pricingModel: String,
    studentCount: Number,
    actualTrainingDays: Number,
    rate: Number,
    expectedCollegeRevenue: Number,
    totalCollegeReceived: Number,
    collegePendingAmount: Number,
    totalTrainerPayment: Number,
    totalTrainerReleased: Number,
    trainerPaymentPending: Number,
    totalExpenses: Number,
    estimatedProfit: Number,
    actualCashBalance: Number,
    collegePaymentStatus: String,
    trainerPaymentStatus: String,
    trainers: Array,
    expenses: Array,
    collegePayments: Array,
    trainerPayments: Array
  },
  emailDeliveryStatus: {
    type: String,
    enum: ['Sent', 'Failed', 'Pending', 'Disabled'],
    default: 'Pending'
  },
  emailSentTo: {
    type: String,
    default: ''
  },
  emailSentAt: {
    type: Date
  },
  emailError: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// 5. Financial Report Email Delivery Logs
const collegeFinancialEmailLogSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  triggerEvent: {
    type: String,
    default: ''
  },
  recipient: {
    type: String,
    required: true
  },
  cc: [{
    type: String
  }],
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed', 'Retrying'],
    default: 'Sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = {
  CollegePaymentTransaction: mongoose.model('CollegePaymentTransaction', collegePaymentTransactionSchema),
  TrainerPaymentTransaction: mongoose.model('TrainerPaymentTransaction', trainerPaymentTransactionSchema),
  CollegeFinancialConfig: mongoose.model('CollegeFinancialConfig', collegeFinancialConfigSchema),
  CollegeFinancialReport: mongoose.model('CollegeFinancialReport', collegeFinancialReportSchema),
  CollegeFinancialEmailLog: mongoose.model('CollegeFinancialEmailLog', collegeFinancialEmailLogSchema)
};
