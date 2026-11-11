const mongoose = require('mongoose');

const announcementRecipientSchema = new mongoose.Schema({
  announcementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  deliveryStatus: {
    type: String,
    enum: ['Sent', 'Failed'],
    default: 'Sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  failureReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('AnnouncementRecipient', announcementRecipientSchema);
