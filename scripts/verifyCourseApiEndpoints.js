const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Course = require('../models/Course');
const adminDomainController = require('../controllers/adminDomainController');
const adminSyllabusController = require('../controllers/adminSyllabusController');
const lmsController = require('../controllers/lmsController');
const portalController = require('../controllers/portalController');

// Mock express response
function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
}

async function verifyAllApis() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  let errors = 0;

  // 1. Check Course.countDocuments
  const totalInDb = await Course.countDocuments({ isActive: true });
  console.log(`1. Course.countDocuments({ isActive: true }): ${totalInDb}`);
  if (totalInDb === 42) {
    console.log('✓ Exactly 42 active courses in MongoDB.');
  } else {
    console.error(`✗ Expected 42, got ${totalInDb}`);
    errors++;
  }

  // 2. Check adminDomainController.getAllDomainData
  console.log('\n2. Testing adminDomainController.getAllDomainData...');
  const res1 = createMockRes();
  await adminDomainController.getAllDomainData({}, res1);
  const coursesData = res1.data?.data?.courses || [];
  const coursesCount = res1.data?.data?.counts?.courses;
  console.log(`Returned courses: ${coursesData.length}, counts.courses: ${coursesCount}`);
  if (coursesData.length === 42 && coursesCount === 42) {
    console.log('✓ AdminDomainManagement API returns all 42 courses.');
  } else {
    console.error(`✗ AdminDomainManagement API count mismatch!`);
    errors++;
  }

  // 3. Check adminSyllabusController.getGenerationStatus('overall')
  console.log('\n3. Testing adminSyllabusController.getGenerationStatus("overall")...');
  const res2 = createMockRes();
  await adminSyllabusController.getGenerationStatus({ params: { courseId: 'overall' } }, res2);
  const syllabusTotalCourses = res2.data?.data?.counts?.totalCourses;
  console.log(`Returned totalCourses: ${syllabusTotalCourses}`);
  if (syllabusTotalCourses === 42) {
    console.log('✓ Overall Question Bank stats dynamically reflects all 42 courses.');
  } else {
    console.error(`✗ Overall Question Bank stats returned ${syllabusTotalCourses}`);
    errors++;
  }

  // 4. Check lmsController.getCourses
  console.log('\n4. Testing lmsController.getCourses...');
  const res3 = createMockRes();
  await lmsController.getCourses({}, res3);
  const lmsCourses = res3.data?.data || [];
  console.log(`LMS getCourses length: ${lmsCourses.length}`);
  if (lmsCourses.length === 42) {
    console.log('✓ LMS Course API returns all 42 courses.');
  } else {
    console.error(`✗ LMS Course API returned ${lmsCourses.length}`);
    errors++;
  }

  // 5. Check portalController.getCourses
  console.log('\n5. Testing portalController.getCourses...');
  const res4 = createMockRes();
  await portalController.getCourses({ query: {} }, res4);
  const portalCourses = res4.data?.data?.courses || [];
  console.log(`Portal getCourses length: ${portalCourses.length}`);
  if (portalCourses.length === 42) {
    console.log('✓ Public Portal getCourses returns all 42 courses.');
  } else {
    console.error(`✗ Public Portal getCourses returned ${portalCourses.length}`);
    errors++;
  }

  // 6. Check portalController.getHomepageData
  console.log('\n6. Testing portalController.getHomepageData...');
  const res5 = createMockRes();
  await portalController.getHomepageData({}, res5);
  const statsCoursesCount = res5.data?.data?.statistics?.coursesCount;
  console.log(`Homepage stats coursesCount: "${statsCoursesCount}"`);
  if (statsCoursesCount === '42+') {
    console.log('✓ Homepage dynamically reflects "42+".');
  } else {
    console.log(`Homepage stats coursesCount is: ${statsCoursesCount}`);
  }

  console.log('\n======================================================');
  if (errors === 0) {
    console.log('ALL API ENDPOINTS VERIFIED SUCCESSFULLY WITH 42 COURSES!');
  } else {
    console.error(`FAILED WITH ${errors} ERRORS.`);
  }
  console.log('======================================================');

  process.exit(errors > 0 ? 1 : 0);
}

verifyAllApis().catch(err => {
  console.error(err);
  process.exit(1);
});
