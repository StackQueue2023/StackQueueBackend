const mongoose = require('mongoose');

const collegeTrainingModuleSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  syllabusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeTrainingSyllabus',
    required: true,
    index: true
  },
  unitNumber: {
    type: Number,
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  topics: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtopics: [{
      type: String,
      trim: true
    }],
    estimatedHours: {
      type: Number,
      default: 4
    }
  }],
  totalQuestionsCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

collegeTrainingModuleSchema.index({ batchId: 1, order: 1 });
collegeTrainingModuleSchema.index({ collegeId: 1, batchId: 1 });

module.exports = mongoose.model('CollegeTrainingModule', collegeTrainingModuleSchema);
