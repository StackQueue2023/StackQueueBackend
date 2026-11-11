const mongoose = require('mongoose');

const courseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  domain: {
    type: String,
    required: [true, 'Associated domain is required'],
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Prevent duplicate category names within the same domain (case-insensitive)
courseCategorySchema.index(
  { domain: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('CourseCategory', courseCategorySchema);
