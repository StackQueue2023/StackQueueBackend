const mongoose = require('mongoose');

/**
 * Stores versioned snapshots of existing questions before any automated repair,
 * replacement, or deactivation during syllabus audit/regeneration.
 */
const questionBackupSchema = new mongoose.Schema({
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  collectionName: {
    type: String,
    enum: ['InterviewQuestion', 'Challenge', 'DomainTask'],
    required: true,
    index: true
  },
  targetFeature: {
    type: String,
    default: ''
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    index: true
  },
  topic: {
    type: String,
    default: ''
  },
  topicId: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    required: true
  },
  actionTaken: {
    type: String,
    enum: ['deactivated', 'replaced', 'updated_in_place'],
    required: true
  },
  hasStudentActivity: {
    type: Boolean,
    default: false
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  backedUpAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('QuestionBackup', questionBackupSchema);
