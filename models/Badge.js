const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['General', 'Streak', 'Language', 'DSA', 'DevOps', 'Projects'],
    default: 'General'
  },
  icon: {
    type: String,
    required: true // e.g. 'Award', 'Flame', 'Coffee', 'Code', 'Shield'
  },
  color: {
    type: String,
    default: 'from-amber-400 to-orange-500'
  },
  criteria: {
    type: {
      type: String,
      enum: ['challenges_count', 'streak_days', 'game_completed', 'project_count', 'xp_threshold'],
      required: true
    },
    targetValue: {
      type: Number,
      required: true
    },
    targetGameSlug: {
      type: String,
      default: ''
    }
  },
  xpBonus: {
    type: Number,
    default: 50
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
