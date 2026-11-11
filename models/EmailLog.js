const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchDailyReport'
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  recipients: [{
    type: String
  }],
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SENT', 'FAILED', 'PENDING'],
    default: 'PENDING'
  },
  errorDetails: {
    type: String,
    default: ''
  },
  sentAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);
