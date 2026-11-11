const mongoose = require('mongoose');

const dailyTeachingUpdateSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  topicCovered: {
    type: String,
    required: true
  },
  practicalActivity: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

dailyTeachingUpdateSchema.index({ batchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyTeachingUpdate', dailyTeachingUpdateSchema);
