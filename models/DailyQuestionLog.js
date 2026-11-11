const mongoose = require('mongoose');

const dailyQuestionLogSchema = new mongoose.Schema({
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
    index: true
  },
  domain: {
    type: String,
    default: 'java',
    index: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestion',
    required: true
  }
}, { timestamps: true });

dailyQuestionLogSchema.index({ date: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('DailyQuestionLog', dailyQuestionLogSchema);
