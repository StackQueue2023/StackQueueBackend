const mongoose = require('mongoose');

const emailNotificationHistorySchema = new mongoose.Schema({
  notificationType: {
    type: String,
    enum: ['DAILY_TRAINING_REPORT', 'WEEKLY_TRAINING_REPORT', 'INDIVIDUAL_TASK_COMPLETION'],
    required: true,
    index: true
  },
  dedupeKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  recipients: [{
    email: { type: String, required: true },
    role: { type: String, enum: ['HOD', 'PLACEMENT_OFFICER', 'OTHER'], default: 'OTHER' }
  }],
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastError: {
    type: String,
    default: ''
  },
  hasPdfAttachment: {
    type: Boolean,
    default: false
  },
  payloadSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sentAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

emailNotificationHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailNotificationHistory', emailNotificationHistorySchema);
