const mongoose = require('mongoose');

const statisticSchema = new mongoose.Schema({
  coursesCount: { type: String, default: '50+' },
  internshipDomainsCount: { type: String, default: '50+' },
  studentsTrained: { type: String, default: '1,250+' },
  studentsLearning: { type: String, default: '450+' },
  productsDeveloped: { type: String, default: '28+' },
  yearsExperience: { type: String, default: '10+' },
  industryProjects: { type: String, default: '120+' },
  internshipStudents: { type: String, default: '850+' }
}, { _id: false });

const featuredCourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  domain: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, default: '12 Weeks' },
  level: { type: String, default: 'Beginner to Advanced' },
  skills: [{ type: String }],
  isTrending: { type: Boolean, default: false },
  studentsEnrolled: { type: Number, default: 240 },
  rating: { type: Number, default: 4.9 },
  icon: { type: String, default: 'Code' }
});

const internshipDomainSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, default: 'Full Stack Development' },
  technology: { type: String, required: true },
  duration: { type: String, default: '8–16 Weeks' },
  mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Hybrid' },
  skills: [{ type: String }],
  hasCertificate: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  icon: { type: String, default: 'Briefcase' }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  technology: { type: String, required: true },
  category: { type: String, default: 'Enterprise SaaS' },
  imageUrl: { type: String, default: '' },
  demoUrl: { type: String, default: '#' },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: true }
});

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  validity: { type: String, default: 'Limited Time' },
  discount: { type: String, default: '25% OFF' },
  type: { type: String, enum: ['Course', 'Internship', 'Combo', 'Seasonal', 'Student'], default: 'Combo' },
  applyUrl: { type: String, default: '/contact' },
  badgeColor: { type: String, default: 'amber' }
});

const companyPortalSchema = new mongoose.Schema({
  companyName: { type: String, default: 'STACK QUEUE' },
  tagline: {
    type: String,
    default: 'Inclusive Learning — Empowering students with industry-oriented technology training, practical learning, internship opportunities, and real-world product development.'
  },
  statistics: { type: statisticSchema, default: () => ({}) },
  featuredCourses: [featuredCourseSchema],
  internshipDomains: [internshipDomainSchema],
  products: [productSchema],
  specialOffers: [offerSchema]
}, { timestamps: true });

module.exports = mongoose.model('CompanyPortal', companyPortalSchema);
