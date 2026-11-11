const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Concept = require('../models/Concept');
const ConceptTask = require('../models/ConceptTask');
const ConceptTaskSubmission = require('../models/ConceptTaskSubmission');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const lmsController = require('../controllers/lmsController');
const authController = require('../controllers/authController');

function mockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = {
    body,
    params,
    query,
    user,
    headers: {}
  };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    }
  };

  return { req, res };
}

async function runVerification() {
  console.log('🚀 STARTING COMPREHENSIVE LMS VERIFICATION...\n');
  await connectDB();

  try {
    // -------------------------------------------------------------
    // Test 1: Student Login with Student ID "STU1001"
    // -------------------------------------------------------------
    console.log('TEST 1: Student Login with Student ID "STU1001"');
    const { req: req1, res: res1 } = mockReqRes({
      identifier: 'STU1001',
      password: 'Student@123'
    });
    await authController.login(req1, res1);
    const data1 = res1.getResponseData();
    if (res1.getStatusCode() === 200 && data1.success && data1.user.studentId === 'STU1001') {
      console.log('✅ TEST 1 PASSED: Successfully authenticated via STU1001');
      console.log(`   User: ${data1.user.name}, Role: ${data1.user.role}, Student ID: ${data1.user.studentId}`);
    } else {
      throw new Error(`TEST 1 FAILED: ${JSON.stringify(data1)}`);
    }

    const studentUser = await User.findOne({ studentId: 'STU1001' });
    const tutorUser = await User.findOne({ email: 'arun@codequest.com' });
    const adminUser = await User.findOne({ email: 'admin@codequest.com' });
    const hashMapConcept = await Concept.findOne({ title: 'HashMap' });

    // -------------------------------------------------------------
    // Test 2: Tutor Concept Gate Check (LOCKED state)
    // When concept is NOT_STARTED or IN_PROGRESS, student task access MUST FAIL with 403
    // -------------------------------------------------------------
    console.log('\nTEST 2: Strict Backend Completion Gate Validation');
    hashMapConcept.tutorStatus = 'IN_PROGRESS';
    await hashMapConcept.save();

    const { req: req2, res: res2 } = mockReqRes({}, { conceptId: hashMapConcept._id.toString() }, {}, studentUser);
    await lmsController.getConceptTasks(req2, res2);
    const data2 = res2.getResponseData();

    if (res2.getStatusCode() === 403 && data2.success === false && data2.message === 'This concept has not been completed by the tutor yet.') {
      console.log('✅ TEST 2 PASSED: Backend strictly rejected task access with HTTP 403');
      console.log(`   Exact expected error returned: "${data2.message}"`);
    } else {
      throw new Error(`TEST 2 FAILED: Expected 403 and exact message, got ${res2.getStatusCode()} ${JSON.stringify(data2)}`);
    }

    // -------------------------------------------------------------
    // Test 3: Tutor Marks Concept COMPLETED
    // -------------------------------------------------------------
    console.log('\nTEST 3: Tutor Arun marks HashMap as COMPLETED');
    const { req: req3, res: res3 } = mockReqRes(
      { status: 'COMPLETED' },
      { conceptId: hashMapConcept._id.toString() },
      {},
      tutorUser
    );
    await lmsController.updateConceptStatus(req3, res3);
    const data3 = res3.getResponseData();

    if (res3.getStatusCode() === 200 && data3.success && data3.data.tutorStatus === 'COMPLETED') {
      console.log('✅ TEST 3 PASSED: Tutor Arun successfully marked HashMap COMPLETED');
      console.log(`   Backend Response: "${data3.message}"`);
    } else {
      throw new Error(`TEST 3 FAILED: ${JSON.stringify(data3)}`);
    }

    // -------------------------------------------------------------
    // Test 4: Unauthorized foreign tutor cannot modify Arun's concept
    // -------------------------------------------------------------
    console.log('\nTEST 4: Foreign Tutor cannot modify Arun\'s concept');
    const fakeTutor = await User.create({
      name: 'Rival Tutor',
      email: 'rival@codequest.com',
      username: 'rival',
      password: 'Rival@123',
      role: 'tutor'
    });

    const { req: req4, res: res4 } = mockReqRes(
      { status: 'NOT_STARTED' },
      { conceptId: hashMapConcept._id.toString() },
      {},
      fakeTutor
    );
    await lmsController.updateConceptStatus(req4, res4);
    const data4 = res4.getResponseData();

    if (res4.getStatusCode() === 403 && data4.success === false) {
      console.log('✅ TEST 4 PASSED: Foreign tutor modification blocked with HTTP 403');
    } else {
      throw new Error(`TEST 4 FAILED: Foreign tutor was not rejected!`);
    }
    await User.deleteOne({ _id: fakeTutor._id });

    // -------------------------------------------------------------
    // Test 5: Student Task Unlock & Progress (7 / 10 = 70%)
    // -------------------------------------------------------------
    console.log('\nTEST 5: Student fetches unlocked tasks & verifies 7/10 progress');
    const { req: req5, res: res5 } = mockReqRes({}, { conceptId: hashMapConcept._id.toString() }, {}, studentUser);
    await lmsController.getConceptTasks(req5, res5);
    const data5 = res5.getResponseData();

    if (res5.getStatusCode() === 200 && data5.success && data5.data.tasks.length === 10) {
      const completedCount = data5.data.progress.completed;
      const totalCount = data5.data.progress.total;
      const pct = data5.data.progress.percentage;
      console.log(`✅ TEST 5 PASSED: Tasks unlocked! Total: ${totalCount}, Completed: ${completedCount}, Progress: ${pct}%`);
      if (completedCount !== 7 || pct !== 70) {
        throw new Error(`Expected 7/10 and 70%, got ${completedCount}/${totalCount} (${pct}%)`);
      }
    } else {
      throw new Error(`TEST 5 FAILED: ${JSON.stringify(data5)}`);
    }

    // -------------------------------------------------------------
    // Test 6: Online Class vs Offline Class Scheduling & View
    // -------------------------------------------------------------
    console.log('\nTEST 6: Online Class meeting link vs Offline Class classroom distinction');
    const onlineClass = await Session.findOne({ sessionType: 'ONLINE', courseId: hashMapConcept.courseId });
    const offlineClass = await Session.findOne({ sessionType: 'OFFLINE', courseId: hashMapConcept.courseId });

    if (onlineClass && onlineClass.meetingLink && onlineClass.meetingLink.includes('meet.google.com')) {
      console.log(`✅ Online Class verified: ${onlineClass.title} => Meeting Link: ${onlineClass.meetingLink}`);
    } else {
      throw new Error('Online class missing meeting link');
    }

    if (offlineClass && offlineClass.classroom && (!offlineClass.meetingLink || offlineClass.meetingLink === '')) {
      console.log(`✅ Offline Class verified: ${offlineClass.title} => 📍 Classroom: ${offlineClass.classroom} (NO meeting link)`);
    } else {
      throw new Error('Offline class should not have meeting link');
    }

    // -------------------------------------------------------------
    // Test 7: Student Absence Reason Submission Flow
    // -------------------------------------------------------------
    console.log('\nTEST 7: Student Absence Reason Submission Flow');
    const anyAbsent = await Session.findOne({ 'attendance.status': 'ABSENT' });
    const { req: req7, res: res7 } = mockReqRes(
      { reason: 'Medical Leave', description: 'Suffering from fever.' },
      { sessionId: anyAbsent._id.toString() },
      {},
      studentUser
    );
    await lmsController.submitAbsenceReason(req7, res7);
    const data7 = res7.getResponseData();
    if (res7.getStatusCode() === 200 && data7.success) {
      console.log('✅ TEST 7 PASSED: Absence reason successfully submitted and saved');
      console.log(`   Saved reason: ${data7.data.reason}`);
    } else {
      throw new Error(`TEST 7 FAILED: ${JSON.stringify(data7)}`);
    }

    // -------------------------------------------------------------
    // Test 8: Dynamic Dashboard Metrics
    // -------------------------------------------------------------
    console.log('\nTEST 8: Dynamic Dashboard Metrics Validation');
    const { req: req8, res: res8 } = mockReqRes({}, {}, {}, studentUser);
    await lmsController.getStudentDashboard(req8, res8);
    const data8 = res8.getResponseData();

    if (res8.getStatusCode() === 200 && data8.success) {
      const m = data8.data.metrics;
      console.log('✅ TEST 8 PASSED: Dynamic dashboard retrieved live database values:');
      console.log(`   - Overall Learning: ${m.overallLearningPercentage}%`);
      console.log(`   - Syllabus Progress: ${m.syllabusProgressPercentage}% (${m.completedConcepts}/${m.totalConcepts} concepts)`);
      console.log(`   - Task Progress: ${m.taskProgressPercentage}% (${m.completedTasks}/${m.totalTasks} tasks)`);
      console.log(`   - Attendance: ${m.attendancePercentage}% (Present: ${m.attendance.present}, Absent: ${m.attendance.absent}, Leave: ${m.attendance.leave})`);
      console.log(`   - Today's Class: ${data8.data.todaysClass?.title} (${data8.data.todaysClass?.sessionType})`);
      console.log(`   - Current Learning: ${data8.data.currentLearning?.conceptTitle} (${data8.data.currentLearning?.tasksCompleted}/${data8.data.currentLearning?.tasksTotal} tasks, ${data8.data.currentLearning?.taskPercentage}%)`);
      console.log(`   - Roadmap Modules: ${data8.data.roadmap?.length} modules`);
    } else {
      throw new Error(`TEST 8 FAILED: ${JSON.stringify(data8)}`);
    }

    console.log('\n🎉 ALL 8 BACKEND & WORKFLOW TESTS PASSED 100% CLEANLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runVerification();
