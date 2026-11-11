const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  offerType: {
    type: String,
    required: [true, 'Offer type is required'],
    enum: ['Course Discount', 'Early Bird', 'Seasonal', 'Bundle', 'Special', 'Festival', 'Student Referral'],
    default: 'Course Discount'
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  applicableCourses: [{
    type: String,
    trim: true
  }],
  applicableStudentCategory: {
    type: String,
    enum: ['All Students', 'New Students', 'Existing Students', 'College Training', 'LMS Students'],
    default: 'All Students'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  couponCode: {
    type: String,
    uppercase: true,
    trim: true,
    sparse: true
  },
  termsAndConditions: {
    type: String,
    default: ''
  },
  bannerUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDraft: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Helper virtual / method to get computed status
offerSchema.methods.getComputedStatus = function() {
  if (this.isDraft) return 'Draft';
  if (!this.isActive) return 'Inactive';
  const now = new Date();
  if (now < new Date(this.startDate)) return 'Scheduled';
  if (now > new Date(this.endDate)) return 'Expired';
  return 'Active';
};

// Transform to include status in JSON output
offerSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.status = doc.getComputedStatus();
    return ret;
  }
});

module.exports = mongoose.model('Offer', offerSchema);
