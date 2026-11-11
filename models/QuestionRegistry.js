const mongoose = require('mongoose');

const questionRegistrySchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['DAILY_CHALLENGE', 'INTERVIEW_ARENA', 'GAME_HUB', 'MOCK_INTERVIEW', 'SYLLABUS', 'CHALLENGE_MANAGER', 'TESTING_PRACTICE'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  normalizedTitle: {
    type: String,
    required: true,
    index: true
  },
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  domain: {
    type: String,
    default: 'general',
    index: true
  },
  technology: {
    type: String,
    default: '',
    index: true
  },
  compiler: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  isDuplicate: {
    type: Boolean,
    default: false,
    index: true
  },
  duplicateOf: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

questionRegistrySchema.index({ fingerprint: 1, source: 1 });

module.exports = mongoose.model('QuestionRegistry', questionRegistrySchema);
