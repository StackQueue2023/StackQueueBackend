const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  academicYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '1st Year'
  },
  batchType: {
    type: String,
    enum: ['LMS', 'COLLEGE_TRAINING'],
    default: 'LMS',
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  department: {
    type: String,
    trim: true,
    default: 'CSE'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE'
  },
  description: {
    type: String,
    default: ''
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'active'
  },
  saturdayIncluded: {
    type: Boolean,
    default: false
  },
  sundayIncluded: {
    type: Boolean,
    default: false
  },
  trainingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  startTime: {
    type: String,
    default: '09:00 AM'
  },
  endTime: {
    type: String,
    default: '04:30 PM'
  },
  breakStartTime: {
    type: String,
    default: '01:00 PM'
  },
  breakEndTime: {
    type: String,
    default: '02:00 PM'
  },
  dailyReportTime: {
    type: String,
    default: '18:00' // 'HH:MM' 24hr format or '06:00 PM'
  },
  holidays: [{
    date: { type: String }, // YYYY-MM-DD
    title: { type: String }
  }],
  collegeGuideName: {
    type: String,
    default: ''
  },
  collegeGuideEmail: {
    type: String,
    default: ''
  },
  placementOfficeEmail: {
    type: String,
    default: ''
  },
  hodName: {
    type: String,
    default: ''
  },
  hodEmail: {
    type: String,
    default: ''
  },
  tutorResumeUrl: {
    type: String,
    default: ''
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  // --- FINANCIAL & EXTENDED COLLEGE TRAINING CONFIGURATION ---
  pricingModel: {
    type: String,
    enum: ['PER_STUDENT', 'PER_DAY'],
    default: 'PER_STUDENT'
  },
  ratePerStudent: {
    type: Number,
    default: 2000
  },
  ratePerDay: {
    type: Number,
    default: 5000
  },
  actualTrainingDays: {
    type: Number,
    default: 0
  },
  expectedCollegeRevenue: {
    type: Number,
    default: 0
  },
  totalCollegeReceived: {
    type: Number,
    default: 0
  },
  collegePendingAmount: {
    type: Number,
    default: 0
  },
  collegePaymentStatus: {
    type: String,
    enum: ['Not Received', 'Partially Received', 'Fully Received', 'Overdue'],
    default: 'Not Received'
  },
  collegePaymentDueDate: {
    type: Date
  },
  collegeLastPaymentDate: {
    type: Date
  },
  // Multi-trainer assignment with independent rates and payments
  assignedTrainers: [{
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    domain: { type: String, default: '' },
    paymentModel: {
      type: String,
      enum: ['FIXED', 'PER_DAY'],
      default: 'PER_DAY'
    },
    rate: { type: Number, default: 0 },
    assignedDays: { type: Number, default: 0 },
    totalPayment: { type: Number, default: 0 },
    amountReleased: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Not Released', 'Partially Released', 'Fully Paid'],
      default: 'Not Released'
    },
    dueDate: { type: Date },
    lastPaymentDate: { type: Date },
    assignedDates: [{ type: Date }]
  }],
  totalTrainerPayment: {
    type: Number,
    default: 0
  },
  totalTrainerReleased: {
    type: Number,
    default: 0
  },
  trainerPaymentPending: {
    type: Number,
    default: 0
  },
  trainerPaymentStatus: {
    type: String,
    enum: ['Not Released', 'Partially Released', 'Fully Paid'],
    default: 'Not Released'
  },
  // Scheduled training days (for day-based calculations and sessions)
  scheduledDays: [{
    dayNumber: { type: Number },
    date: { type: Date },
    morningTopic: { type: String, default: '' },
    afternoonTopic: { type: String, default: '' },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trainerName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled'
    },
    isHoliday: { type: Boolean, default: false }
  }],
  // Other training expenses (travel, stay, food, materials, other)
  expenses: [{
    expenseId: { type: String },
    category: {
      type: String,
      enum: ['Travel', 'Accommodation', 'Food', 'Training Materials', 'Other'],
      default: 'Other'
    },
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Paid'
    },
    receiptUrl: { type: String, default: '' }
  }],
  totalExpenses: {
    type: Number,
    default: 0
  },
  estimatedProfit: {
    type: Number,
    default: 0
  },
  actualCashBalance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

batchSchema.index({ batchType: 1, status: 1 });
batchSchema.index({ collegeId: 1 });
batchSchema.index({ courseId: 1 });
batchSchema.index({ trainerId: 1 });
batchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Batch', batchSchema);
