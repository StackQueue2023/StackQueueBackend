const mongoose = require('mongoose');

const gameLevelSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  gameSlug: {
    type: String,
    required: true
  },
  levelNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  requiredXpToUnlock: {
    type: Number,
    default: 0
  },
  xpReward: {
    type: Number,
    default: 25
  },
  challenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }]
}, { timestamps: true });

gameLevelSchema.index({ gameId: 1, levelNumber: 1 }, { unique: true });

module.exports = mongoose.model('GameLevel', gameLevelSchema);
