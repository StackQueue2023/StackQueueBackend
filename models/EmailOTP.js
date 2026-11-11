const mongoose = require('mongoose');

const emailOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  otpExpiresAt: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  used: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Auto-expire documents from MongoDB after 30 minutes
emailOTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = mongoose.model('EmailOTP', emailOTPSchema);
