const mongoose = require('mongoose');

/**
 * StudentModuleStatus
 * Tracks the availability/status of each module on a per-student basis.
 * Controlled directly by the student's assigned Tutor / Trainer.
 *
 * Statuses:
 * - 'not_started': Module is locked (🔒). Student cannot start/submit tasks.
 * - 'processing': Module is unlocked (🔓). Student can attempt tasks.
 * - 'completed': Module is completed by tutor (✅). Next module remains locked until tutor enables it.
 */
const studentModuleStatusSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true,
    required: false
  },
  status: {
    type: String,
    enum: ['not_started', 'processing', 'completed'],
    default: 'not_started',
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure uniqueness: exactly one status record per student per module
studentModuleStatusSchema.index({ studentId: 1, moduleId: 1 }, { unique: true });
studentModuleStatusSchema.index({ studentId: 1, domain: 1 });

module.exports = mongoose.model('StudentModuleStatus', studentModuleStatusSchema);
