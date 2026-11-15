const Batch = require('../models/Batch');
const { toDateStr, getMondaySundayRange } = require('./trainingPerformanceService');
const { sendDailyTrainingReportEmail, sendWeeklyTrainingReportEmail } = require('./trainingNotificationService');

let schedulerTimer = null;

function getIstClockParts() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return { weekday, hour, minute, hhmm: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

async function runTrainingReportTick() {
  try {
    const todayStr = toDateStr(new Date());
    const { weekday, hour, hhmm } = getIstClockParts();

    const trainingBatches = await Batch.find({ batchType: 'COLLEGE_TRAINING' })
      .select('_id name dailyReportTime hodEmail placementOfficeEmail collegeId')
      .lean();

    for (const batch of trainingBatches) {
      const targetTime = batch.dailyReportTime || '18:00';
      if (hhmm >= targetTime) {
        await sendDailyTrainingReportEmail(batch._id, todayStr).catch((err) => {
          console.error(`[TrainingScheduler] Daily report error for batch ${batch._id}:`, err.message);
        });
      }

      // Sunday >= 18:00 IST -> send weekly Monday-Sunday report
      if (weekday === 'Sun' && hour >= 18) {
        const { weekStart, weekEnd } = getMondaySundayRange(todayStr);
        await sendWeeklyTrainingReportEmail(batch._id, weekStart, weekEnd).catch((err) => {
          console.error(`[TrainingScheduler] Weekly report error for batch ${batch._id}:`, err.message);
        });
      }
    }
  } catch (err) {
    console.error('[TrainingScheduler] Tick error:', err.message);
  }
}

function initTrainingReportScheduler() {
  if (schedulerTimer) return schedulerTimer;
  // Check every 5 minutes
  schedulerTimer = setInterval(runTrainingReportTick, 5 * 60 * 1000);
  console.log('[TrainingScheduler] Initialized (5-minute interval)');
  return schedulerTimer;
}

module.exports = {
  initTrainingReportScheduler,
  runTrainingReportTick,
};
