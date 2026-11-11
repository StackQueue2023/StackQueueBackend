const mongoose = require('mongoose');

const projectTaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
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
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Review', 'Completed'],
    default: 'Todo'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: Number,
    default: 1
  },
  xpAwarded: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
