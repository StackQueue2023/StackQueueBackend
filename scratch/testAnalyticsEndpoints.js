const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/Game_project/server/.env' });

const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// Mock req and res
function createMockRes(done) {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      done(null, { statusCode: this.statusCode, data });
    }
  };
}

async function testEndpoints() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB for endpoint testing.');

  // Test 1: Overview
  await new Promise((resolve, reject) => {
    adminAnalyticsController.getMainOverviewAnalytics({ query: {} }, createMockRes((err, res) => {
      if (err || !res.data.success) return reject(err || res.data);
      console.log('✓ Main Overview Analytics OK:', res.data.data.categoryDistribution.map(c => `${c.name}: ${c.count} (${c.percentage}%)`).join(', '));
      console.log('  Peak Performers:', Object.keys(res.data.data.peakPerformers));
      resolve();
    }));
  });

  // Test 2: Courses
  await new Promise((resolve, reject) => {
    adminAnalyticsController.getCourseAnalytics({ query: {} }, createMockRes((err, res) => {
      if (err || !res.data.success) return reject(err || res.data);
      console.log('✓ Course Analytics OK: totalCourses =', res.data.data.totalCourses, ', studentRows =', res.data.data.studentRows.length);
      resolve();
    }));
  });

  // Test 3: Internships
  await new Promise((resolve, reject) => {
    adminAnalyticsController.getInternshipAnalytics({ query: {} }, createMockRes((err, res) => {
      if (err || !res.data.success) return reject(err || res.data);
      console.log('✓ Internship Analytics OK: totalInternships =', res.data.data.totalInternships, ', studentRows =', res.data.data.studentRows.length);
      resolve();
    }));
  });

  // Test 4: Products
  await new Promise((resolve, reject) => {
    adminAnalyticsController.getProductAnalytics({ query: {} }, createMockRes((err, res) => {
      if (err || !res.data.success) return reject(err || res.data);
      console.log('✓ Product Analytics OK: totalProducts =', res.data.data.totalProducts, ', peakByReadiness =', res.data.data.peakByReadiness.title);
      resolve();
    }));
  });

  // Test 5: College Training
  await new Promise((resolve, reject) => {
    adminAnalyticsController.getCollegeTrainingAnalytics({ query: {} }, createMockRes((err, res) => {
      if (err || !res.data.success) return reject(err || res.data);
      console.log('✓ College Training Analytics OK: totalColleges =', res.data.data.totalColleges, ', tableRows =', res.data.data.tableRows.length);
      resolve();
    }));
  });

  // Test 6: College Projects
  await new Promise((resolve, reject) => {
    adminAnalyticsController.getCollegeProjectAnalytics({ query: {} }, createMockRes((err, res) => {
      if (err || !res.data.success) return reject(err || res.data);
      console.log('✓ College Projects Analytics OK: totalProjects =', res.data.data.totalProjects, ', tableRows =', res.data.data.tableRows.length);
      resolve();
    }));
  });

  await mongoose.disconnect();
  console.log('\nALL 6 BACKEND ANALYTICS ENDPOINTS TESTED SUCCESSFULLY!');
}

testEndpoints().catch(err => {
  console.error('Error testing endpoints:', err);
  process.exit(1);
});
