const mongoose = require('mongoose');

const dailyTrainingReportSchema = new mongoose.Schema({
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTraining',
    required: true,
    index: true
  },
  dayNumber: {
    type: Number,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD or formatted date string
    required: true
  },

  // Sessions
  morningTopic: {
    type: String,
    required: [true, 'Morning Session Topic is required.'],
    trim: true
  },
  afternoonTopic: {
    type: String,
    required: [true, 'Afternoon Session Topic is required.'],
    trim: true
  },

  // Attendance
  studentsPresent: {
    type: Number,
    required: true
  },
  studentsAbsent: {
    type: Number,
    required: true
  },
  totalStudents: {
    type: Number,
    required: true
  },

  // Practical Session
  practicalConducted: {
    type: Boolean,
    default: true
  },
  practicalTasks: [{
    type: String,
    trim: true
  }],

  // Student Feedback
  studentFeedbackReceived: {
    type: Boolean,
    default: false
  },
  studentFeedback: {
    type: String,
    default: ''
  },
  studentPositiveFeedback: {
    type: String,
    default: ''
  },
  studentDifficulties: {
    type: String,
    default: ''
  },
  studentSuggestions: {
    type: String,
    default: ''
  },

  // Student / Staff Complaint Section
  complaintReported: {
    type: Boolean,
    default: false
  },
  complaintRaisedBy: {
    type: String,
    enum: ['Student', 'Staff', 'Other'],
    default: 'Student'
  },
  complaintName: {
    type: String,
    default: ''
  },
  complaintCategory: {
    type: String,
    enum: ['Training', 'Tutor', 'Attendance', 'Infrastructure', 'Lab / System', 'Internet', 'Course Content', 'Other'],
    default: 'Training'
  },
  complaintDetails: {
    type: String,
    default: ''
  },
  complaintPriority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  actionTaken: {
    type: String,
    default: ''
  },
  complaintStatus: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },

  // Trainer Remarks
  trainerRemarks: {
    type: String,
    default: ''
  },

  submittedAt: {
    type: Date,
    default: Date.now
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Enforce UNIQUE compound index so trainingId + dayNumber is unique (prevents duplicate daily reports)
dailyTrainingReportSchema.index({ trainingId: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('DailyTrainingReport', dailyTrainingReportSchema);
