const mongoose = require('mongoose');

const internshipStudentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipBatch',
    required: true,
    index: true
  },
  batchCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  college: {
    type: String,
    default: '',
    trim: true
  },
  department: {
    type: String,
    default: '',
    trim: true
  },
  fee: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Fully Paid', 'Partially Paid', 'Unpaid', 'Review Required'],
    default: 'Unpaid',
    index: true
  },
  paymentMode: {
    type: String,
    default: 'Online'
  },
  transactionRef: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date,
    default: null
  },
  currentDay: {
    type: Number,
    default: 1
  },
  completedDays: [{
    type: Number
  }],
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  activationToken: {
    type: String,
    default: ''
  },
  isActivated: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

internshipStudentSchema.index({ batchId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('InternshipStudent', internshipStudentSchema);
