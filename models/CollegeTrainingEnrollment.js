const mongoose = require('mongoose');

const collegeTrainingEnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  permanentStudentId: {
    type: String,
    trim: true,
    index: true
  },
  collegeTrainingBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  collegeName: {
    type: String,
    default: ''
  },
  batchName: {
    type: String,
    default: ''
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTraining'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  courseName: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  completionDate: {
    type: Date,
    default: null
  },
  mode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'DROPPED'],
    default: 'ACTIVE',
    index: true
  },
  // Course-specific authentication and lifecycle
  courseUsername: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true
  },
  coursePassword: {
    type: String,
    select: false
  },
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'DEACTIVATED', 'REVOKED'],
    default: 'ACTIVE',
    index: true
  },
  tokenVersion: {
    type: Number,
    default: 1
  },
  credentialsCreatedAt: {
    type: Date,
    default: Date.now
  },
  credentialsRevokedAt: {
    type: Date,
    default: null
  },
  revocationReason: {
    type: String,
    default: ''
  },
  // Training progress and history
  dailyProgress: {
    completedDays: { type: Number, default: 0 },
    totalDays: { type: Number, default: 10 }
  },
  attendance: [{
    date: { type: Date },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'LEAVE', 'LATE'], default: 'PRESENT' },
    notes: { type: String, default: '' }
  }],
  leaveRequests: [{
    reason: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
  }],
  tasks: [{
    taskTitle: String,
    completed: { type: Boolean, default: false },
    score: Number
  }],
  points: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  complaints: [{
    text: String,
    date: { type: Date, default: Date.now }
  }],
  interviewStatus: {
    type: String,
    enum: ['NOT_SCHEDULED', 'SCHEDULED', 'PASSED', 'FAILED'],
    default: 'NOT_SCHEDULED'
  },
  passFailReason: {
    type: String,
    default: ''
  },
  tutorAction: {
    type: String,
    default: ''
  }
}, { timestamps: true });

collegeTrainingEnrollmentSchema.index({ studentId: 1, collegeTrainingBatchId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('CollegeTrainingEnrollment', collegeTrainingEnrollmentSchema);
