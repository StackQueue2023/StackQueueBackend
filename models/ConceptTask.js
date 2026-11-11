const mongoose = require('mongoose');

const conceptTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  starterCode: {
    type: String,
    default: ''
  },
  expectedOutput: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  marks: {
    type: Number,
    default: 10
  },
  order: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

conceptTaskSchema.index({ conceptId: 1, order: 1 });

module.exports = mongoose.model('ConceptTask', conceptTaskSchema);
