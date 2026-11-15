const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  departments: [{
    type: String
  }],
  contactEmail: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    default: ''
  },
  hodName: {
    type: String,
    default: ''
  },
  hodEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  placementOfficerName: {
    type: String,
    default: ''
  },
  placementOfficerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);
