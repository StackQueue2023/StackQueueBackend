const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'SESSION_CREATED',
      'SESSION_RESCHEDULED',
      'SESSION_STARTED',
      'SESSION_ENDED',
      'SESSION_CANCELLED',
      'TASK_CREATED',
      'TASK_SUBMITTED',
      'TASK_APPROVED',
      'TASK_REJECTED',
      'GUIDANCE_ADDED',
      'TUTOR_ASSIGNED',
      'STUDENT_ASSIGNED',
      'ATTENDANCE_MARKED',
      'INTERVIEW_SUBMISSION'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Session', 'StudentTask', 'TutorGuidance', 'StudentProfile', 'Attendance', 'Batch', 'InterviewSubmission']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
