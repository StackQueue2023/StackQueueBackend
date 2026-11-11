const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false,
    index: true
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 1
  },
  topics: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

moduleSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Module', moduleSchema);
