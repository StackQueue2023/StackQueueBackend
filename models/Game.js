const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  tagline: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Frontend', 'Backend', 'Data Structures', 'Database', 'DevOps & Cloud', 'Full Stack'],
    default: 'Frontend'
  },
  icon: {
    type: String,
    default: 'Gamepad2'
  },
  badgeRewardName: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels'],
    default: 'All Levels'
  },
  themeColor: {
    primary: { type: String, default: '#3b82f6' },
    accent: { type: String, default: '#60a5fa' },
    gradient: { type: String, default: 'from-blue-600 to-cyan-500' }
  },
  totalLevels: {
    type: Number,
    default: 100
  },
  order: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
