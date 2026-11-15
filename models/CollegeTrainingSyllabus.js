const mongoose = require('mongoose');

const collegeTrainingSyllabusSchema = new mongoose.Schema({
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
    unique: true,
    index: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    default: 'General'
  },
  trainingDays: {
    type: Number,
    default: 10,
    min: 1
  },
  durationHours: {
    type: Number,
    default: 40,
    min: 1
  },
  rawSyllabusText: {
    type: String,
    default: ''
  },
  pdfFileName: {
    type: String,
    default: ''
  },
  pdfFileUrl: {
    type: String,
    default: ''
  },
  units: [{
    unitNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
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
    estimatedDays: {
      type: Number,
      default: 2
    }
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'SAVED', 'MODULES_GENERATED'],
    default: 'SAVED',
    index: true
  },
  generatedModulesCount: {
    type: Number,
    default: 0
  },
  generatedQuestionsCount: {
    type: Number,
    default: 0
  },
  lastGeneratedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

collegeTrainingSyllabusSchema.index({ collegeId: 1, batchId: 1 });

module.exports = mongoose.model('CollegeTrainingSyllabus', collegeTrainingSyllabusSchema);
