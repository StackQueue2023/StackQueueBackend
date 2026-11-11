const connectDB = require('../config/db');
const College = require('../models/College');
const Batch = require('../models/Batch');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const DailyTeachingUpdate = require('../models/DailyTeachingUpdate');
const BatchDailyReport = require('../models/BatchDailyReport');
const EmailLog = require('../models/EmailLog');
const Attendance = require('../models/Attendance');

(async () => {
  try {
    await connectDB();
    console.log('[ResetScript] Clearing all existing colleges, batches, reports, and related logs...');

    const deletedColleges = await College.deleteMany({});
    console.log(`Deleted ${deletedColleges.deletedCount} college records.`);

    const deletedBatches = await Batch.deleteMany({});
    console.log(`Deleted ${deletedBatches.deletedCount} batch records.`);

    const deletedUpdates = await DailyTeachingUpdate.deleteMany({});
    console.log(`Deleted ${deletedUpdates.deletedCount} daily teaching update records.`);

    const deletedReports = await BatchDailyReport.deleteMany({});
    console.log(`Deleted ${deletedReports.deletedCount} daily report records.`);

    const deletedLogs = await EmailLog.deleteMany({});
    console.log(`Deleted ${deletedLogs.deletedCount} email log records.`);

    const deletedAttendance = await Attendance.deleteMany({ batchId: { $ne: null } });
    console.log(`Deleted ${deletedAttendance.deletedCount} batch attendance records.`);

    // Clear collegeId & batchId references on StudentProfiles
    const spResult = await StudentProfile.updateMany(
      {},
      { $set: { collegeId: null, batchId: null } }
    );
    console.log(`Updated ${spResult.modifiedCount} student profiles to clear old college & batch links.`);

    // Clear assignedColleges & assignedBatches on TrainerProfiles
    const tpResult = await TrainerProfile.updateMany(
      {},
      { $set: { assignedColleges: [], assignedBatches: [] } }
    );
    console.log(`Updated ${tpResult.modifiedCount} trainer profiles.`);

    console.log('Successfully wiped all existing college and batch data! You can now create fresh colleges and cohorts cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing colleges and batches:', error);
    process.exit(1);
  }
})();
