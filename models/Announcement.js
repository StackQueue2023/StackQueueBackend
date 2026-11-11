const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'General Announcement',
      'Holiday',
      'Sunday Leave',
      'Training Update',
      'College Notice',
      'Exam / Assessment',
      'Event',
      'Emergency Notice',
      'Other'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  announcementDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  recipientType: {
    type: String,
    enum: ['All Students', 'All Tutors', 'Students + Tutors'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  successfullySent: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Sending', 'Sent', 'Failed'],
    default: 'Sent'
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
