const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'trainer', 'tutor', 'admin'],
    default: 'student'
  },
  studentType: {
    type: String,
    enum: ['LMS', 'COLLEGE_TRAINING', 'INSTITUTE_TRAINING', 'BOTH'],
    default: 'LMS',
    index: true
  },
  trainingEligible: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: 'avatar-cyber-1'
  },
  phone: {
    type: String,
    default: ''
  },
  resetPasswordOtp: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, studentType: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
