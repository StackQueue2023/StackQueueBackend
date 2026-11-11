const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    uppercase: true,
    trim: true,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  studentType: {
    type: String,
    enum: ['LMS', 'COLLEGE_TRAINING', 'INSTITUTE_TRAINING', 'BOTH'],
    default: 'LMS',
    index: true
  },
  enrolledCourseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true,
    default: null,
    index: true
  },
  assignedTutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  learningMode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE'
  },
  monthlyFee: {
    type: Number,
    default: 2000,
    min: 0
  },
  courseDuration: {
    type: String,
    default: '12 Weeks'
  },
  courseDurationWeeks: {
    type: Number,
    default: 12
  },
  totalHours: {
    type: Number,
    default: 120
  },
  totalCourseFee: {
    type: Number,
    default: 24000,
    min: 0
  },
  downPaymentCollected: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingPrincipal: {
    type: Number,
    default: 24000,
    min: 0
  },
  feePaymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partially Paid'],
    default: 'Pending',
    index: true
  },
  lastPaymentDate: {
    type: Date
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  academicYear: {
    type: String,
    trim: true,
    default: ''
  },
  learningJourney: {
    currentSubjectTitle: { type: String, default: 'Core Java & OOP' },
    currentTopic: { type: String, default: 'Classes & Objects' },
    nextSuggestedTopic: { type: String, default: 'Inheritance & Polymorphism' },
    completedTopics: [{
      topicTitle: { type: String, required: true },
      completedAt: { type: Date, default: Date.now },
      sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' }
    }]
  },
  totalXp: {
    type: Number,
    default: 0
  },
  currentLevel: {
    level: { type: Number, default: 1 },
    title: { type: String, default: 'Beginner' },
    icon: { type: String, default: '🌱' }
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  stats: {
    challengesSolved: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    accuracyRate: { type: Number, default: 100 },
    timeSpentMinutes: { type: Number, default: 0 },
    dailyChallengesCompleted: { type: Number, default: 0 },
    projectsSubmitted: { type: Number, default: 0 }
  },
  strongTopics: [{ type: String }],
  weakTopics: [{ type: String }],
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  bio: { type: String, default: 'Aspiring IT Specialist' },
  previousCourses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    domain: { type: String },
    completedAt: { type: Date, default: Date.now },
    finalPoints: { type: Number, default: 0 },
    finalProgress: { type: Number, default: 0 }
  }]
}, { timestamps: true });

studentProfileSchema.index({ batchId: 1 });
studentProfileSchema.index({ collegeId: 1 });
studentProfileSchema.index({ enrolledCourseId: 1 });
studentProfileSchema.index({ assignedTutorId: 1 });
studentProfileSchema.index({ studentType: 1, createdAt: -1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
