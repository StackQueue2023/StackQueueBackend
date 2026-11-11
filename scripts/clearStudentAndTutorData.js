const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const DailyTeachingUpdate = require('../models/DailyTeachingUpdate');
const BatchDailyReport = require('../models/BatchDailyReport');
const TutorGuidance = require('../models/TutorGuidance');
const StudentTask = require('../models/StudentTask');
const StudentBadge = require('../models/StudentBadge');
const StudentInternship = require('../models/StudentInternship');
const StudentModuleStatus = require('../models/StudentModuleStatus');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const InterviewProgress = require('../models/InterviewProgress');
const InterviewSubmission = require('../models/InterviewSubmission');
const InterviewSession = require('../models/InterviewSession');
const ConceptTaskSubmission = require('../models/ConceptTaskSubmission');
const XPTransaction = require('../models/XPTransaction');
const Attempt = require('../models/Attempt');

async function clearStudentAndTutorData() {
  console.log('[Cleanup] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/game_project');

  console.log('[Cleanup] Removing all student and tutor user accounts (preserving admin users)...');
  const deletedUsers = await User.deleteMany({ role: { $in: ['student', 'tutor', 'trainer'] } });

  console.log('[Cleanup] Cleaning associated profiles, batches, submissions, and activity logs...');
  const [
    studentProfiles,
    trainerProfiles,
    batches,
    attendance,
    leaveRequests,
    teachingUpdates,
    batchReports,
    tutorGuidance,
    studentTasks,
    studentBadges,
    studentInternships,
    studentModuleStatus,
    studentDomainProgress,
    interviewProgress,
    interviewSubmissions,
    interviewSessions,
    conceptSubmissions,
    xpTransactions,
    attempts
  ] = await Promise.all([
    StudentProfile.deleteMany({}),
    TrainerProfile.deleteMany({}),
    Batch.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    DailyTeachingUpdate.deleteMany({}),
    BatchDailyReport.deleteMany({}),
    TutorGuidance.deleteMany({}),
    StudentTask.deleteMany({}),
    StudentBadge.deleteMany({}),
    StudentInternship.deleteMany({}),
    StudentModuleStatus.deleteMany({}),
    StudentDomainProgress.deleteMany({}),
    InterviewProgress.deleteMany({}),
    InterviewSubmission.deleteMany({}),
    InterviewSession.deleteMany({}),
    ConceptTaskSubmission.deleteMany({}),
    XPTransaction.deleteMany({}),
    Attempt.deleteMany({})
  ]);

  console.log('\n================ CLEANUP SUMMARY ================');
  console.log(`- Deleted Student/Tutor Users: ${deletedUsers.deletedCount}`);
  console.log(`- Deleted Student Profiles: ${studentProfiles.deletedCount}`);
  console.log(`- Deleted Trainer/Tutor Profiles: ${trainerProfiles.deletedCount}`);
  console.log(`- Deleted Batches: ${batches.deletedCount}`);
  console.log(`- Deleted Attendance Records: ${attendance.deletedCount}`);
  console.log(`- Deleted Teaching Updates & Reports: ${teachingUpdates.deletedCount + batchReports.deletedCount}`);
  console.log(`- Deleted Submissions & Progress Records: ${interviewSubmissions.deletedCount + conceptSubmissions.deletedCount}`);
  
  const remainingAdmins = await User.find({ role: 'admin' }, 'name username email');
  console.log('\nPreserved Admin Users:');
  remainingAdmins.forEach(a => console.log(`  - [Admin] ${a.name} (@${a.username}) <${a.email}>`));
  console.log('=================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  clearStudentAndTutorData()
    .then(() => {
      console.log('[Cleanup] All student and tutor data successfully cleared!');
      process.exit(0);
    })
    .catch(err => {
      console.error('[Cleanup] Error clearing student and tutor data:', err);
      process.exit(1);
    });
}

module.exports = clearStudentAndTutorData;
