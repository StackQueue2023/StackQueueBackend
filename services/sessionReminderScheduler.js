const Session = require('../models/Session');
const User = require('../models/User');
const { sendLiveClassReminderEmail } = require('./emailService');

/**
 * Background Scheduler to check upcoming ONLINE sessions and automatically send 
 * email reminders 30 minutes before class start time.
 */
const checkAndSendClassReminders = async () => {
  try {
    const now = new Date();
    // 35-minute forward window
    const targetWindowEnd = new Date(now.getTime() + 35 * 60 * 1000);
    const pastWindowStart = new Date(now.getTime() - 10 * 60 * 1000);

    // Find ONLINE upcoming sessions where scheduledStartDateTime is within [now - 10m, now + 35m]
    // and reminderSent is not true
    const sessions = await Session.find({
      sessionType: 'ONLINE',
      status: 'UPCOMING',
      reminderSent: { $ne: true },
      scheduledStartDateTime: { $gte: pastWindowStart, $lte: targetWindowEnd }
    })
      .populate('studentIds', 'name email')
      .populate('tutorId', 'name email')
      .populate('courseId', 'title')
      .populate('batchId', 'name code');

    for (const session of sessions) {
      // Mark reminderSent = true immediately to prevent duplicate sends
      session.reminderSent = true;
      await session.save();

      console.log(`[ReminderScheduler] Triggering 30-min email reminder for session "${session.title}" (${session.scheduledDate} ${session.startTime})...`);

      const batchName = session.batchId?.name || '';
      const courseTitle = session.courseId?.title || '';
      const tutorName = session.tutorId?.name || '';

      // 1. Send email to assigned students
      if (session.studentIds && session.studentIds.length > 0) {
        for (const st of session.studentIds) {
          if (st && st.email) {
            await sendLiveClassReminderEmail({
              toEmail: st.email,
              recipientName: st.name,
              batchName,
              courseTitle,
              tutorName,
              topic: session.title || session.topic,
              scheduledDate: session.scheduledDate,
              startTime: session.startTime,
              endTime: session.endTime,
              meetingLink: session.meetingLink
            });
          }
        }
      }

      // 2. Send email to assigned tutor if email present
      if (session.tutorId && session.tutorId.email) {
        await sendLiveClassReminderEmail({
          toEmail: session.tutorId.email,
          recipientName: session.tutorId.name,
          batchName,
          courseTitle,
          tutorName,
          topic: session.title || session.topic,
          scheduledDate: session.scheduledDate,
          startTime: session.startTime,
          endTime: session.endTime,
          meetingLink: session.meetingLink
        });
      }
    }
  } catch (error) {
    console.error('[ReminderScheduler] Error in checkAndSendClassReminders:', error);
    const { captureError } = require('./errorAlertService');
    captureError(error, {
      service: 'Live Class Reminder Scheduler',
      severity: 'HIGH',
      impact: 'Automated 30-minute reminder email dispatch encountered a failure'
    }).catch(() => {});
  }
};

let reminderInterval = null;

exports.initLiveClassReminderScheduler = () => {
  if (reminderInterval) return;
  console.log('[ReminderScheduler] Initializing automated 30-minute live class email reminder scheduler...');
  // Run check immediately on start
  checkAndSendClassReminders();
  // Check every 60 seconds
  reminderInterval = setInterval(checkAndSendClassReminders, 60 * 1000);
};
