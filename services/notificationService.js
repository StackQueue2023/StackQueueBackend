const Notification = require('../models/Notification');
const Session = require('../models/Session');
const User = require('../models/User');

// In-memory set to prevent duplicate reminder notifications
const reminderSentLog = new Set();

class NotificationService {
  constructor(config = {}) {
    this.smsProvider = config.smsProvider || process.env.SMS_PROVIDER || 'MOCK';
    this.emailProvider = config.emailProvider || process.env.EMAIL_PROVIDER || 'MOCK';
  }

  /**
   * Send SMS via configured provider (Twilio, MSG91, AWS SNS, etc.)
   */
  async sendSMS(to, message) {
    // In production, integrate Twilio / MSG91 client using process.env credentials
    console.log(`[NotificationService:SMS] [To: ${to}] ${message.replace(/\n/g, ' ')}`);
    return {
      success: true,
      provider: this.smsProvider,
      to,
      timestamp: new Date()
    };
  }

  /**
   * Send Email via configured provider (SES, Nodemailer, Sendgrid)
   */
  async sendEmail(to, subject, body) {
    console.log(`[NotificationService:Email] [To: ${to}] Subject: ${subject}`);
    return {
      success: true,
      provider: this.emailProvider,
      to,
      subject,
      timestamp: new Date()
    };
  }

  /**
   * In-App persistent notification record
   */
  async createInAppNotification(userId, title, message, type = 'training_reminder', link = '') {
    try {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        isRead: false
      });
      return notification;
    } catch (err) {
      console.error('[NotificationService] Error creating in-app notification:', err.message);
      return null;
    }
  }

  /**
   * Morning Tutor SMS / Notification
   * Format specified in Master Specification:
   * "Good Morning Karthik,
   * Today's Sessions:
   * 10:00 AM - Arun - Java OOP
   * ...
   * You have 3 sessions scheduled today.
   * Have a productive day!"
   */
  async sendMorningTutorDigest(tutorId) {
    const todayStr = new Date().toISOString().split('T')[0];
    const tutor = await User.findById(tutorId);
    if (!tutor) return null;

    const sessions = await Session.find({
      tutorId,
      scheduledDate: todayStr,
      status: { $ne: 'CANCELLED' }
    }).populate('studentIds', 'name');

    let scheduleLines = '';
    sessions.forEach((s) => {
      const studentNames = s.studentIds.map(st => st.name).join(', ') || 'Batch';
      scheduleLines += `${s.startTime} - ${studentNames} - ${s.topic}\n`;
    });

    if (sessions.length === 0) {
      scheduleLines = 'No sessions scheduled for today.\n';
    }

    const message = `Good Morning ${tutor.name},\n\nToday's Sessions:\n\n${scheduleLines}\nYou have ${sessions.length} session${sessions.length === 1 ? '' : 's'} scheduled today.\n\nHave a productive day!`;

    // Send SMS
    const smsResult = await this.sendSMS(tutor.phone || '+1-555-TUTOR', message);

    // Send in-app notification
    await this.createInAppNotification(
      tutorId,
      `Morning Schedule (${sessions.length} Sessions)`,
      `You have ${sessions.length} live session${sessions.length === 1 ? '' : 's'} scheduled for today.`,
      'training_reminder',
      '/trainer'
    );

    return {
      message,
      sessionCount: sessions.length,
      smsResult
    };
  }

  /**
   * Automated 30m, 5m, and 0m Session Reminders
   */
  async checkAndSendSessionReminders() {
    const now = new Date();
    const upcomingWindow = new Date(now.getTime() + 35 * 60 * 1000); // lookahead 35 mins

    const sessions = await Session.find({
      scheduledStartDateTime: { $gte: now, $lte: upcomingWindow },
      status: 'UPCOMING'
    }).populate('studentIds', 'name email phone').populate('tutorId', 'name email phone');

    for (const s of sessions) {
      const diffMinutes = Math.round((s.scheduledStartDateTime.getTime() - now.getTime()) / (60 * 1000));

      // 30-minute reminder
      if (diffMinutes >= 28 && diffMinutes <= 32) {
        const key = `${s._id}-30m`;
        if (!reminderSentLog.has(key)) {
          reminderSentLog.add(key);
          for (const student of s.studentIds) {
            await this.createInAppNotification(
              student._id,
              `Upcoming Class in 30 mins: ${s.topic}`,
              `Your class with ${s.tutorId?.name || 'Tutor'} starts in 30 minutes (${s.startTime}).`,
              'training_reminder',
              '/'
            );
          }
        }
      }

      // 5-minute reminder
      if (diffMinutes >= 3 && diffMinutes <= 6) {
        const key = `${s._id}-5m`;
        if (!reminderSentLog.has(key)) {
          reminderSentLog.add(key);
          for (const student of s.studentIds) {
            await this.createInAppNotification(
              student._id,
              `Class Starts in 5 mins: ${s.topic}`,
              `Your class starts at ${s.startTime}. Click to join live.`,
              'training_reminder',
              '/'
            );
          }
        }
      }
    }
  }
}

module.exports = new NotificationService();
