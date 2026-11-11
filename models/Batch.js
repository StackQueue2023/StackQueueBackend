const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  academicYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '1st Year'
  },
  batchType: {
    type: String,
    enum: ['LMS', 'COLLEGE_TRAINING'],
    default: 'LMS',
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  department: {
    type: String,
    trim: true,
    default: 'CSE'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE'
  },
  description: {
    type: String,
    default: ''
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'active'
  },
  saturdayIncluded: {
    type: Boolean,
    default: false
  },
  sundayIncluded: {
    type: Boolean,
    default: false
  },
  trainingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  startTime: {
    type: String,
    default: '09:00 AM'
  },
  endTime: {
    type: String,
    default: '04:30 PM'
  },
  breakStartTime: {
    type: String,
    default: '01:00 PM'
  },
  breakEndTime: {
    type: String,
    default: '02:00 PM'
  },
  dailyReportTime: {
    type: String,
    default: '18:00' // 'HH:MM' 24hr format or '06:00 PM'
  },
  holidays: [{
    date: { type: String }, // YYYY-MM-DD
    title: { type: String }
  }],
  collegeGuideName: {
    type: String,
    default: ''
  },
  collegeGuideEmail: {
    type: String,
    default: ''
  },
  placementOfficeEmail: {
    type: String,
    default: ''
  },
  hodName: {
    type: String,
    default: ''
  },
  hodEmail: {
    type: String,
    default: ''
  },
  tutorResumeUrl: {
    type: String,
    default: ''
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

batchSchema.index({ batchType: 1, status: 1 });
batchSchema.index({ collegeId: 1 });
batchSchema.index({ courseId: 1 });
batchSchema.index({ trainerId: 1 });
batchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Batch', batchSchema);
