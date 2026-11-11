const mongoose = require('mongoose');

/**
 * Internship — Internship programs offered by the company
 */
const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  techStack: [{ type: String }],
  domain: {
    type: String,
    trim: true,
    default: 'Full Stack Development'
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    default: null,
    index: true
  },
  category: {
    type: String,
    default: 'Enterprise Software'
  },
  durationWeeks: {
    type: Number,
    default: 4
  },
  durationText: {
    type: String,
    default: '1 Month'
  },
  stipend: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  color: {
    type: String,
    default: 'from-green-500 to-emerald-600'
  },
  icon: {
    type: String,
    default: '💼'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

internshipSchema.index({ createdAt: -1 });
internshipSchema.index({ domain: 1, isActive: 1 });
internshipSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Internship', internshipSchema);
