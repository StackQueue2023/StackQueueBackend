const mongoose = require('mongoose');

async function clearAttendance() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
    console.log('Connected to MongoDB...');

    const Session = require('../models/Session');
    const LeaveRequest = require('../models/LeaveRequest');
    const Attendance = require('../models/Attendance');
    const StudentAttendance = require('../models/StudentAttendance');
    const StudentLeave = require('../models/StudentLeave');
    const TutorAttendance = require('../models/TutorAttendance');

    const sRes = await Session.updateMany({}, { $set: { attendance: [] } });
    console.log('Cleared Session attendance arrays:', sRes);

    const lrRes = await LeaveRequest.deleteMany({});
    console.log('Cleared LeaveRequests:', lrRes.deletedCount);

    const aRes = await Attendance.deleteMany({});
    console.log('Cleared Attendance:', aRes.deletedCount);

    const saRes = await StudentAttendance.deleteMany({});
    console.log('Cleared StudentAttendance:', saRes.deletedCount);

    const slRes = await StudentLeave.deleteMany({});
    console.log('Cleared StudentLeave:', slRes.deletedCount);

    const taRes = await TutorAttendance.deleteMany({});
    console.log('Cleared TutorAttendance:', taRes.deletedCount);

    console.log('All attendance logs successfully cleared!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error clearing attendance:', err);
    process.exit(1);
  }
}

clearAttendance();
