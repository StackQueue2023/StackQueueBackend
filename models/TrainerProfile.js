const mongoose = require('mongoose');

const trainerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  tutorId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    index: true
  },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  alternatePhone: { type: String, default: '' },
  profilePhotoUrl: { type: String, default: '' },

  // Address
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'India' },
  pincode: { type: String, default: '' },

  // Links
  socialLinks: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },

  // Employment
  employmentType: {
    type: String,
    enum: ['FULL-TIME', 'PART-TIME'],
    default: 'FULL-TIME',
    required: true,
    index: true
  },
  professionalBio: { type: String, default: '' },
  totalExperience: { type: String, default: '0 Years' },

  // Education
  education: [{
    degree: { type: String, default: '' },
    specialization: { type: String, default: '' },
    institution: { type: String, default: '' },
    university: { type: String, default: '' },
    startYear: { type: Number },
    endYear: { type: Number },
    grade: { type: String, default: '' }
  }],

  // Work Experience
  experience: [{
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    employmentType: { type: String, default: 'Full-Time' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    currentlyWorking: { type: Boolean, default: false },
    location: { type: String, default: '' },
    responsibilities: { type: String, default: '' },
    skillsUsed: [{ type: String }]
  }],

  // Skills
  skills: [{
    name: { type: String, required: true },
    category: { type: String, default: 'Technical' },
    proficiency: { type: String, default: 'Advanced' }
  }],

  // Certifications
  certifications: [{
    name: { type: String, default: '' },
    organization: { type: String, default: '' },
    issueDate: { type: String, default: '' },
    expiryDate: { type: String, default: '' },
    credentialId: { type: String, default: '' },
    credentialUrl: { type: String, default: '' }
  }],

  // Languages
  languages: [{
    language: { type: String, default: '' },
    proficiency: { type: String, default: 'Fluent' }
  }],

  // Teaching Domains (Linked to Course model)
  teachingDomains: [{
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    domainName: { type: String, required: true },
    teachingLevel: { type: String, default: 'Primary' },
    experienceYears: { type: Number, default: 1 },
    priority: { type: String, enum: ['Primary', 'Secondary'], default: 'Primary' }
  }],

  // Specializations
  teachingSpecializations: {
    primary: { type: String, default: '' },
    secondary: { type: String, default: '' },
    preferredTopics: [{ type: String }]
  },

  // Availability
  availability: [{
    dayOfWeek: { type: String, required: true },
    startTime: { type: String, default: '09:00 AM' },
    endTime: { type: String, default: '05:00 PM' }
  }],

  // Resume Document
  resumeDocument: {
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    uploadedAt: { type: Date }
  },

  // Assignments
  specializations: [{ type: String }],
  assignedColleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }],
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  title: {
    type: String,
    default: 'Technical Tutor & Trainer'
  },
  department: {
    type: String,
    default: 'Computer Science & Engineering'
  },
  totalSessionsConducted: {
    type: Number,
    default: 0
  },

  // Additional Profile & Qualification Fields
  qualification: { type: String, default: '' },
  dateOfBirth: { type: Date },
  expectedSalary: { type: Number, default: 0 },
  expectedAnnualSalary: { type: Number, default: 0 },

  // Data Quality & Verification Statuses
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailStatus: {
    type: String,
    enum: ['NOT_CHECKED', 'FORMAT_VALID', 'DOMAIN_VALID', 'DISPOSABLE_EMAIL', 'VERIFIED'],
    default: 'FORMAT_VALID'
  },
  phoneStatus: {
    type: String,
    enum: ['NOT_CHECKED', 'FORMAT_VALID', 'OTP_VERIFIED'],
    default: 'FORMAT_VALID'
  },
  profileValidationStatus: {
    type: String,
    enum: ['VALID', 'WARNING', 'FAILED'],
    default: 'VALID'
  },
  emailVerifiedAt: { type: Date },
  phoneVerifiedAt: { type: Date },
  validationResults: [{
    field: { type: String },
    value: { type: String },
    status: { type: String },
    reason: { type: String },
    verification_method: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema);
