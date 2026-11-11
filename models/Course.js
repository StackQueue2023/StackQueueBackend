const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
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
  category: {
    type: String,
    default: 'Enterprise Software'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseCategory',
    default: null,
    index: true
  },
  domain: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    default: null,
    index: true
  },
  icon: {
    type: String,
    default: 'Code'
  },
  color: {
    type: String,
    default: 'from-blue-600 to-indigo-600'
  },
  durationValue: {
    type: Number,
    default: 12,
    min: 1
  },
  durationUnit: {
    type: String,
    enum: ['Weeks', 'Months', 'Days'],
    default: 'Weeks'
  },
  durationWeeks: {
    type: Number,
    default: 12
  },
  durationMonths: {
    type: Number,
    default: 3,
    min: 1
  },
  durationText: {
    type: String,
    default: '12 Weeks'
  },
  totalCourseFee: {
    type: Number,
    default: 24000,
    min: 0
  },
  monthlyInstallment: {
    type: Number,
    default: 2000,
    min: 1
  },
  totalHours: {
    type: Number,
    default: 120,
    min: 1
  },
  coursePrefix: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'SQ-CRS'
  },
  studentIdPrefix: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'SQ-STU'
  },
  startingSequence: {
    type: Number,
    default: 1,
    min: 1
  },
  currentSequence: {
    type: Number,
    default: 0,
    min: 0
  },
  studentIdFormat: {
    type: String,
    trim: true,
    default: 'SQ-STU-0001'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  syllabusText: {
    type: String,
    default: ''
  }
}, { timestamps: true });

courseSchema.index({ createdAt: -1 });
courseSchema.index({ category: 1, isActive: 1 });
courseSchema.index({ domain: 1, isActive: 1 });
courseSchema.index({ categoryId: 1, isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
