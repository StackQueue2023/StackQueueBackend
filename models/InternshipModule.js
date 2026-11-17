const mongoose = require('mongoose');

const internshipModuleSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipBatch',
    required: true,
    index: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  dayNumber: {
    type: Number,
    required: true,
    min: 1
  },
  dayTitle: {
    type: String,
    required: true,
    trim: true
  },
  topics: [{
    type: String,
    trim: true
  }],
  subtopics: [{
    type: String,
    trim: true
  }],
  learningContent: {
    type: String,
    default: ''
  },
  practicalExercises: [{
    title: String,
    description: String,
    codeSnippet: String,
    instructions: String
  }],
  tasks: [{
    title: String,
    description: String,
    taskType: {
      type: String,
      default: 'practical'
    },
    points: {
      type: Number,
      default: 10
    }
  }],
  totalQuestions: {
    type: Number,
    default: 0
  },
  estimatedHours: {
    type: Number,
    default: 3
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  }
}, { timestamps: true });

internshipModuleSchema.index({ batchId: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('InternshipModule', internshipModuleSchema);
