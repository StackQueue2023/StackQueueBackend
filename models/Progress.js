const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  gameSlug: {
    type: String,
    required: true,
    index: true
  },
  completedChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  unlockedLevel: {
    type: Number,
    default: 1
  },
  totalGameXp: {
    type: Number,
    default: 0
  },
  totalStars: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  lastPlayedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

progressSchema.index({ studentId: 1, gameSlug: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
