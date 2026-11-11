const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  errorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'HIGH',
    index: true
  },
  errorType: {
    type: String,
    default: 'Error'
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  service: {
    type: String,
    default: 'Institute Backend API',
    index: true
  },
  endpoint: {
    type: String,
    default: 'N/A'
  },
  method: {
    type: String,
    default: 'N/A'
  },
  statusCode: {
    type: Number,
    default: 500
  },
  requestId: {
    type: String,
    default: 'N/A',
    index: true
  },
  environment: {
    type: String,
    default: process.env.NODE_ENV || 'development'
  },
  fileName: {
    type: String,
    default: 'Unknown'
  },
  functionName: {
    type: String,
    default: 'Unknown'
  },
  lineNumber: {
    type: Number
  },
  columnNumber: {
    type: Number
  },
  requestDetails: {
    ip: String,
    userAgent: String,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed
  },
  remediationHint: {
    type: String,
    default: ''
  },
  impact: {
    type: String,
    default: 'Operation failed partially or completely'
  },
  pageName: {
    type: String,
    default: ''
  },
  moduleName: {
    type: String,
    default: ''
  },
  errorCategory: {
    type: String,
    default: ''
  },
  failedApi: {
    type: String,
    default: ''
  },
  isFrontend: {
    type: Boolean,
    default: false,
    index: true
  },
  diagnosticDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  occurrences: {
    type: Number,
    default: 1
  },
  firstOccurredAt: {
    type: Date,
    default: Date.now
  },
  lastOccurredAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  alertStatus: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'THROTTLED', 'SUPPRESSED'],
    default: 'PENDING',
    index: true
  },
  alertAttempts: {
    type: Number,
    default: 0
  },
  lastAlertSentAt: {
    type: Date
  },
  alertError: {
    type: String
  },
  dispatchLatencyMs: {
    type: Number
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedByName: {
    type: String
  },
  resolutionNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for querying recent errors by service/severity
errorLogSchema.index({ severity: 1, isResolved: 1, lastOccurredAt: -1 });
errorLogSchema.index({ fingerprint: 1, isResolved: 1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
