const mongoose = require('mongoose');

async function clearDummyUsersData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
    console.log('Connected to MongoDB...');

    const User = require('../models/User');
    const TrainerProfile = require('../models/TrainerProfile');
    const StudentProfile = require('../models/StudentProfile');
    const Progress = require('../models/Progress');
    const InterviewProgress = require('../models/InterviewProgress');
    const StudentDomainProgress = require('../models/StudentDomainProgress');
    const StudentInternship = require('../models/StudentInternship');
    const StudentLeave = require('../models/StudentLeave');
    const StudentAttendance = require('../models/StudentAttendance');
    const StudentBadge = require('../models/StudentBadge');
    const StudentTask = require('../models/StudentTask');
    const ConceptTaskSubmission = require('../models/ConceptTaskSubmission');
    const InterviewSubmission = require('../models/InterviewSubmission');
    const Notification = require('../models/Notification');
    const AuditLog = require('../models/AuditLog');

    // 1. Delete non-admin users
    const uRes = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('Deleted non-admin users:', uRes.deletedCount);

    // 2. Clear profiles
    const tpRes = await TrainerProfile.deleteMany({});
    console.log('Cleared TrainerProfiles:', tpRes.deletedCount);

    const spRes = await StudentProfile.deleteMany({});
    console.log('Cleared StudentProfiles:', spRes.deletedCount);

    // 3. Clear student tracking & progress data
    const pRes = await Progress.deleteMany({});
    console.log('Cleared Progresses:', pRes.deletedCount);

    const ipRes = await InterviewProgress.deleteMany({});
    console.log('Cleared InterviewProgresses:', ipRes.deletedCount);

    const sdpRes = await StudentDomainProgress.deleteMany({});
    console.log('Cleared StudentDomainProgresses:', sdpRes.deletedCount);

    const siRes = await StudentInternship.deleteMany({});
    console.log('Cleared StudentInternships:', siRes.deletedCount);

    const slRes = await StudentLeave.deleteMany({});
    console.log('Cleared StudentLeaves:', slRes.deletedCount);

    const saRes = await StudentAttendance.deleteMany({});
    console.log('Cleared StudentAttendances:', saRes.deletedCount);

    const sbRes = await StudentBadge.deleteMany({});
    console.log('Cleared StudentBadges:', sbRes.deletedCount);

    const stRes = await StudentTask.deleteMany({});
    console.log('Cleared StudentTasks:', stRes.deletedCount);

    const ctsRes = await ConceptTaskSubmission.deleteMany({});
    console.log('Cleared ConceptTaskSubmissions:', ctsRes.deletedCount);

    const isRes = await InterviewSubmission.deleteMany({});
    console.log('Cleared InterviewSubmissions:', isRes.deletedCount);

    const nRes = await Notification.deleteMany({});
    console.log('Cleared Notifications:', nRes.deletedCount);

    const alRes = await AuditLog.deleteMany({});
    console.log('Cleared AuditLogs:', alRes.deletedCount);

    console.log('\n--- VERIFICATION ---');
    const remainingUsers = await User.find();
    console.log('Remaining Users in DB:', remainingUsers.map(u => ({ username: u.username, email: u.email, role: u.role })));

    mongoose.disconnect();
  } catch (err) {
    console.error('Error clearing dummy data:', err);
    process.exit(1);
  }
}

clearDummyUsersData();
