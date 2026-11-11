const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
    unique: true,
    index: true
  },
  challenges: [{
    slot: {
      type: String,
      lowercase: true,
      trim: true,
      required: true
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true
    }
  }],
  bonusXp: {
    type: Number,
    default: 100
  },
  completions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedSlots: [{ type: String }],
    completedAll: { type: Boolean, default: false },
    completedAt: { type: Date }
  }]
}, { timestamps: true });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
