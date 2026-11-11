const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message content is required']
  },
  status: {
    type: String,
    enum: ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'],
    default: 'UNREAD'
  },
  adminReply: {
    type: String,
    default: ''
  },
  repliedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
