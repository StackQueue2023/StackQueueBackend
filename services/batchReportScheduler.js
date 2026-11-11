const Batch = require('../models/Batch');
const BatchDailyReport = require('../models/BatchDailyReport');
const { generateDailyReportPDF } = require('./batchPdfReportService');
const { sendDailyReportEmail } = require('./batchEmailService');

/**
 * Check active training batches and trigger automated daily PDF report & email delivery
 * if current time matches or exceeds batch.dailyReportTime on valid training days.
 */
const checkAndRunScheduledReports = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[now.getDay()];

    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`; // e.g. "18:05"

    // Find active batches
    const activeBatches = await Batch.find({ status: 'active' });

    for (const batch of activeBatches) {
      // Check date range
      if (batch.startDate && new Date(batch.startDate) > now) continue;
      if (batch.endDate && new Date(batch.endDate) < new Date(`${todayStr}T00:00:00.000Z`)) continue;

      // Check training days
      const isTrainingDay = batch.trainingDays && batch.trainingDays.includes(currentDayName);
      if (!isTrainingDay) continue;

      // Check holidays
      const isHoliday = batch.holidays && batch.holidays.some(h => h.date === todayStr);
      if (isHoliday) continue;

      // Format batch.dailyReportTime to HH:MM format
      let targetReportTime = batch.dailyReportTime || '18:00';
      if (targetReportTime.includes('PM') || targetReportTime.includes('AM')) {
        // Parse '06:00 PM' format
        const match = targetReportTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hrs = parseInt(match[1], 10);
          const mins = match[2];
          const period = match[3].toUpperCase();
          if (period === 'PM' && hrs < 12) hrs += 12;
          if (period === 'AM' && hrs === 12) hrs = 0;
          targetReportTime = `${String(hrs).padStart(2, '0')}:${mins}`;
        }
      }

      // If current time >= targetReportTime
      if (currentTimeStr >= targetReportTime) {
        // Check if report already exists for today
        const existingReport = await BatchDailyReport.findOne({ batchId: batch._id, date: todayStr });
        if (!existingReport) {
          console.log(`[BatchScheduler] Triggering auto report for batch ${batch.code} on ${todayStr}...`);
          try {
            const report = await generateDailyReportPDF(batch._id, todayStr);
            await sendDailyReportEmail(report._id);
            console.log(`[BatchScheduler] Successfully completed automated daily report & email for batch ${batch.code}.`);
          } catch (err) {
            console.error(`[BatchScheduler] Error executing automated report for batch ${batch.code}:`, err);
            const { captureError } = require('./errorAlertService');
            captureError(err, {
              service: 'Batch Report Scheduler',
              severity: 'HIGH',
              impact: `Automated daily PDF report or email delivery failed for batch ${batch.code}`
            }).catch(() => {});
          }
        }
      }
    }
  } catch (error) {
    console.error('[BatchScheduler] Error in checkAndRunScheduledReports:', error);
    const { captureError } = require('./errorAlertService');
    captureError(error, {
      service: 'Batch Report Scheduler',
      severity: 'HIGH',
      impact: 'Background scheduled batch report check loop encountered an error'
    }).catch(() => {});
  }
};

/**
 * Initialize background scheduler loop
 */
let schedulerInterval = null;

exports.initBatchScheduler = () => {
  if (schedulerInterval) return;
  console.log('[BatchScheduler] Initializing automated daily batch report background scheduler...');
  // Run check immediately on start
  checkAndRunScheduledReports();
  // Check every 5 minutes
  schedulerInterval = setInterval(checkAndRunScheduledReports, 5 * 60 * 1000);
};
