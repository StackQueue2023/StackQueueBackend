const mongoose = require('mongoose');

/**
 * StudentInternship — Tracks a student's enrollment in an internship
 */
const studentInternshipSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  internshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  certificate: {
    type: String,
    default: ''
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C', 'Pending'],
    default: 'Pending'
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

studentInternshipSchema.index({ studentId: 1, internshipId: 1 }, { unique: true });

module.exports = mongoose.model('StudentInternship', studentInternshipSchema);
