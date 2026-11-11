const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: { type: Date },
  leftAt: { type: Date },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LEAVE', 'LATE', 'EXCUSED', 'PENDING'],
    default: 'PENDING'
  },
  absenceReason: {
    type: String,
    enum: [
      'Medical Leave',
      'Personal Reason',
      'College Work',
      'Travel',
      'Emergency',
      'Technical Issue',
      'Other'
    ]
  },
  absenceDescription: {
    type: String,
    default: ''
  },
  absenceSubmittedAt: {
    type: Date
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept'
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  title: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  scheduledDate: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  startDate: {
    type: String, // YYYY-MM-DD - Starting date of schedule range
    default: null,
    index: true
  },
  endDate: {
    type: String, // YYYY-MM-DD - Ending date of schedule range
    default: null,
    index: true
  },
  startTime: {
    type: String, // e.g. "10:00 AM"
    required: true
  },
  endTime: {
    type: String, // e.g. "11:00 AM"
    required: true
  },
  scheduledStartDateTime: {
    type: Date,
    required: true,
    index: true
  },
  scheduledEndDateTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  actualDurationMinutes: {
    type: Number,
    default: 0
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  meetingLink: {
    type: String,
    default: 'https://meet.google.com/cq-live-class'
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED', 'MISSED', 'DELAYED'],
    default: 'UPCOMING',
    index: true
  },
  sessionType: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE'
  },
  classroom: {
    type: String,
    default: ''
  },
  taskAssigned: {
    type: Boolean,
    default: false
  },
  relatedTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentTask'
  },
  learningMaterials: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: 'PDF' }
  }],
  attendance: [attendanceRecordSchema],
  tutorRemarks: {
    type: String,
    default: ''
  },
  reminderSent: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

// Virtual to compute dynamic status based on backend timestamps and grace period
sessionSchema.methods.computeCurrentStatus = function(gracePeriodMinutes = 10) {
  if (this.status === 'COMPLETED' || this.status === 'CANCELLED') {
    return this.status;
  }
  const now = new Date();

  // If tutor explicitly started session
  if (this.actualStartTime && !this.actualEndTime) {
    return 'LIVE';
  }

  const startWithGrace = new Date(this.scheduledStartDateTime.getTime() + gracePeriodMinutes * 60 * 1000);
  const missedThreshold = new Date(this.scheduledEndDateTime.getTime() + 30 * 60 * 1000);

  if (now > missedThreshold && !this.actualStartTime) {
    return 'MISSED';
  }

  if (now > startWithGrace && !this.actualStartTime) {
    return 'DELAYED';
  }

  return 'UPCOMING';
};

module.exports = mongoose.model('Session', sessionSchema);
