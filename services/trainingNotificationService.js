const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const Batch = require('../models/Batch');
const College = require('../models/College');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainingTaskAssignment = require('../models/TrainingTaskAssignment');
const EmailNotificationHistory = require('../models/EmailNotificationHistory');
const {
  toDateStr,
  getMondaySundayRange,
  getOverallTrainingBatchPerformance,
  computeAndSaveWeeklySummary,
} = require('./trainingPerformanceService');
const { APP_NAME, getEmailHeaderHtml, getEmailFooterHtml } = require('../config/brandConfig');

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'reports@stackqueue.in';
  const pass = process.env.SMTP_PASS || '';
  if (!pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function resolveRecipients(batch, college) {
  const byEmail = new Map();
  const hodEmail = batch?.hodEmail || college?.hodEmail;
  if (hodEmail) {
    const e = String(hodEmail).trim().toLowerCase();
    if (e) byEmail.set(e, { email: e, role: 'HOD' });
  }
  const poEmail = batch?.placementOfficeEmail || college?.placementOfficerEmail;
  if (poEmail) {
    const e = String(poEmail).trim().toLowerCase();
    if (e && !byEmail.has(e)) byEmail.set(e, { email: e, role: 'PLACEMENT_OFFICER' });
  }
  // Fallback to configured Admin alert email if no staff email configured yet
  if (byEmail.size === 0) {
    const fallback = process.env.ADMIN_ALERT_EMAIL || 'stackqueue2023@gmail.com';
    byEmail.set(fallback.toLowerCase(), { email: fallback.toLowerCase(), role: 'ADMIN_FALLBACK' });
  }
  return {
    emails: Array.from(byEmail.keys()),
    recipientObjs: Array.from(byEmail.values()),
  };
}

async function sendWithRetry({ to, subject, html, text, attachments = [], transportOverride = null, maxAttempts = 3 }) {
  const transporter = transportOverride || createTransporter();
  if (!transporter) {
    throw new Error('SMTP credentials not configured (SMTP_PASS missing)');
  }
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"${APP_NAME} Training Reports" <${process.env.SMTP_USER || 'reports@stackqueue.in'}>`,
        to: to.join(', '),
        subject,
        html,
        text,
        attachments,
      });
      return { attempts: attempt, messageId: info?.messageId || 'sent' };
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    }
  }
  throw lastError || new Error('Email send failed');
}

function generateWeeklyTrainingPdfBuffer(weeklySummary, batch, college) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).fillColor('#0F172A').text(`${APP_NAME} — Weekly Training Performance Report`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#475569').text(
        `Batch: ${batch?.batchName || batch?.name || 'Training Batch'} | College: ${college?.name || 'N/A'} | Week: ${weeklySummary.weekStart} to ${weeklySummary.weekEnd}`
      );
      doc.moveDown(0.8);

      // Summary metrics box
      doc.fontSize(12).fillColor('#0F172A').text('Weekly Summary Metrics', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#1E293B');
      doc.text(`Total Temporary Students: ${weeklySummary.totalStudents}`);
      doc.text(`Average Attendance %: ${weeklySummary.weeklyAttendancePercent}%`);
      doc.text(`Total Tasks Assigned: ${weeklySummary.totalTasksAssigned}`);
      doc.text(`Total Tasks Completed: ${weeklySummary.totalTasksCompleted}`);
      doc.text(`Total Tasks Pending: ${weeklySummary.totalTasksPending}`);
      doc.text(`Overall Task Completion %: ${weeklySummary.weeklyCompletionPercent}%`);
      doc.moveDown(0.8);

      // Top Performers
      doc.fontSize(12).fillColor('#0F172A').text('Top Performers', { underline: true });
      doc.moveDown(0.3);
      if (weeklySummary.topPerformers && weeklySummary.topPerformers.length > 0) {
        weeklySummary.topPerformers.forEach((tp, idx) => {
          doc.fontSize(10).fillColor('#1E293B').text(
            `${idx + 1}. ${tp.name} — Task Completion: ${tp.completionPercent}% | Attendance: ${tp.attendancePercent}%`
          );
        });
      } else {
        doc.fontSize(10).fillColor('#64748B').text('No top performers recorded for this week.');
      }
      doc.moveDown(0.8);

      // Completed All Tasks
      doc.fontSize(12).fillColor('#0F172A').text('Students Who Completed All Assigned Tasks', { underline: true });
      doc.moveDown(0.3);
      if (weeklySummary.completedAllStudents && weeklySummary.completedAllStudents.length > 0) {
        doc.fontSize(10).fillColor('#15803D').text(weeklySummary.completedAllStudents.join(', '));
      } else {
        doc.fontSize(10).fillColor('#64748B').text('None this week.');
      }
      doc.moveDown(0.8);

      // Student-wise breakdown table
      doc.fontSize(12).fillColor('#0F172A').text('Student-Wise Weekly Breakdown', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(9).fillColor('#334155');
      (weeklySummary.studentBreakdown || []).forEach((row, idx) => {
        if (doc.y > 740) doc.addPage();
        doc.text(
          `${idx + 1}. ${row.name} | Attendance: ${row.attendancePercent}% | Assigned: ${row.tasksAssigned} | Completed: ${row.tasksCompleted} | Pending: ${row.tasksPending} | Completion: ${row.completionPercent}%`
        );
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function buildDailyReportHtml(perf, batch, college, dateStr) {
  const s = perf.summary;
  const studentRowsHtml = (perf.students || [])
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border:1px solid #E2E8F0;">${r.name}</td>
        <td style="padding:8px;border:1px solid #E2E8F0;text-transform:capitalize;">${r.todayAttendance}</td>
        <td style="padding:8px;border:1px solid #E2E8F0;text-align:center;">${r.tasksAssigned}</td>
        <td style="padding:8px;border:1px solid #E2E8F0;text-align:center;">${r.tasksCompleted}</td>
        <td style="padding:8px;border:1px solid #E2E8F0;text-align:center;">${r.tasksPending}</td>
        <td style="padding:8px;border:1px solid #E2E8F0;text-align:center;">${r.taskCompletionPercent}%</td>
      </tr>`
    )
    .join('');

  const completedAllNames = (perf.completedAllStudents || []).map((x) => x.name).join(', ') || 'None';
  const pendingNames = (perf.pendingTaskStudents || []).map((x) => `${x.name} (${x.tasksPending} pending)`).join(', ') || 'None';

  return `
    ${getEmailHeaderHtml('Daily Training Performance Report', `${batch?.batchName || batch?.name || 'Training Batch'} — ${dateStr}`)}
    <div style="font-family:Arial,sans-serif;color:#0F172A;padding:16px;">
      <p><strong>College:</strong> ${college?.name || 'N/A'} | <strong>Department:</strong> ${batch?.department || 'N/A'}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#F8FAFC;">
        <tr>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Total Students:</strong> ${s.totalTemporaryStudents}</td>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Present Today:</strong> ${s.presentToday}</td>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Absent Today:</strong> ${s.absentToday}</td>
        </tr>
        <tr>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Overall Attendance %:</strong> ${s.overallAttendancePercent}%</td>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Tasks Assigned:</strong> ${s.totalTasksAssigned}</td>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Tasks Completed:</strong> ${s.totalTasksCompleted}</td>
        </tr>
        <tr>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Tasks Pending:</strong> ${s.totalTasksPending}</td>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Task Completion %:</strong> ${s.overallTaskCompletionPercent}%</td>
          <td style="padding:10px;border:1px solid #E2E8F0;"><strong>Completed All Tasks:</strong> ${s.completedAllCount}</td>
        </tr>
      </table>

      <p><strong>Students Who Completed All Assigned Tasks:</strong> ${completedAllNames}</p>
      <p><strong>Students With Pending Tasks:</strong> ${pendingNames}</p>

      <h3 style="margin-top:20px;">Individual Student Performance</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#F1F5F9;">
            <th style="padding:8px;border:1px solid #E2E8F0;text-align:left;">Student</th>
            <th style="padding:8px;border:1px solid #E2E8F0;text-align:left;">Attendance</th>
            <th style="padding:8px;border:1px solid #E2E8F0;">Assigned</th>
            <th style="padding:8px;border:1px solid #E2E8F0;">Completed</th>
            <th style="padding:8px;border:1px solid #E2E8F0;">Pending</th>
            <th style="padding:8px;border:1px solid #E2E8F0;">Completion %</th>
          </tr>
        </thead>
        <tbody>${studentRowsHtml}</tbody>
      </table>
    </div>
    ${getEmailFooterHtml()}
  `;
}

async function sendDailyTrainingReportEmail(batchId, dateStr = null, options = {}) {
  const targetDate = toDateStr(dateStr || new Date());
  const batch = await Batch.findById(batchId).lean();
  if (!batch) throw new Error('Batch not found');
  const college = batch.collegeId ? await College.findById(batch.collegeId).lean() : null;

  const { emails: recipients, recipientObjs } = await resolveRecipients(batch, college);
  const dedupeKey = options.force ? undefined : `DAILY_${batchId}_${targetDate}`;

  if (dedupeKey) {
    const existing = await EmailNotificationHistory.findOne({ dedupeKey, status: 'SENT' }).lean();
    if (existing) {
      return { skipped: true, reason: 'Already sent for this date', history: existing };
    }
  }

  const perf = await getOverallTrainingBatchPerformance({ batchId, date: targetDate });
  const subject = `[${APP_NAME}] Daily Training Report — ${batch.batchName || batch.name} (${targetDate})`;
  const html = buildDailyReportHtml(perf, batch, college, targetDate);
  const text = `Daily Training Report for ${batch.batchName || batch.name} on ${targetDate}. Students: ${perf.summary.totalTemporaryStudents}, Present: ${perf.summary.presentToday}, Task Completion: ${perf.summary.overallTaskCompletionPercent}%`;

  if (recipients.length === 0) {
    const history = await EmailNotificationHistory.create({
      notificationType: 'DAILY_TRAINING_REPORT',
      batchId,
      collegeId: batch.collegeId || null,
      recipients: [],
      subject,
      status: 'FAILED',
      attempts: 0,
      lastError: 'No HOD or Placement Officer email configured on batch or college',
      payloadSnapshot: perf.summary,
    });
    return { skipped: true, reason: history.lastError, history };
  }

  try {
    const res = await sendWithRetry({
      to: recipients,
      subject,
      html,
      text,
      transportOverride: options.transport || null,
    });
    const history = await EmailNotificationHistory.findOneAndUpdate(
      dedupeKey ? { dedupeKey } : { _id: new (require('mongoose').Types.ObjectId)() },
      {
        $set: {
          notificationType: 'DAILY_TRAINING_REPORT',
          batchId,
          collegeId: batch.collegeId || null,
          recipients: recipientObjs,
          subject,
          status: 'SENT',
          attempts: res.attempts,
          lastError: '',
          hasPdfAttachment: false,
          payloadSnapshot: perf.summary,
          sentAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return { sent: true, history };
  } catch (err) {
    const history = await EmailNotificationHistory.create({
      notificationType: 'DAILY_TRAINING_REPORT',
      batchId,
      collegeId: batch.collegeId || null,
      recipients: recipientObjs,
      subject,
      status: 'FAILED',
      attempts: 3,
      lastError: err.message,
      hasPdfAttachment: false,
      payloadSnapshot: perf.summary,
    });
    return { sent: false, error: err.message, history };
  }
}

async function sendWeeklyTrainingReportEmail(batchId, weekStartStr = null, weekEndStr = null, options = {}) {
  const batch = await Batch.findById(batchId).lean();
  if (!batch) throw new Error('Batch not found');
  const college = batch.collegeId ? await College.findById(batch.collegeId).lean() : null;

  const range =
    weekStartStr && weekEndStr
      ? { weekStart: toDateStr(weekStartStr), weekEnd: toDateStr(weekEndStr) }
      : getMondaySundayRange(new Date());

  const dedupeKey = options.force ? undefined : `WEEKLY_${batchId}_${range.weekStart}_${range.weekEnd}`;
  if (dedupeKey) {
    const existing = await EmailNotificationHistory.findOne({ dedupeKey, status: 'SENT' }).lean();
    if (existing) {
      return { skipped: true, reason: 'Weekly report already sent', history: existing };
    }
  }

  const weeklySummary = await computeAndSaveWeeklySummary(batchId, range.weekStart, range.weekEnd);
  const pdfBuffer = await generateWeeklyTrainingPdfBuffer(weeklySummary, batch, college);
  const { emails: recipients, recipientObjs } = await resolveRecipients(batch, college);
  const subject = `[${APP_NAME}] Weekly Training Performance Report (${range.weekStart} to ${range.weekEnd}) — ${batch.batchName || batch.name}`;

  const html = `
    ${getEmailHeaderHtml('Weekly Training Performance Report', `${batch.batchName || batch.name} (${range.weekStart} to ${range.weekEnd})`)}
    <div style="font-family:Arial,sans-serif;color:#0F172A;padding:16px;">
      <p>Please find attached the Weekly Training Performance PDF report for <strong>${batch.batchName || batch.name}</strong>.</p>
      <ul>
        <li><strong>Total Students:</strong> ${weeklySummary.totalStudents}</li>
        <li><strong>Average Attendance %:</strong> ${weeklySummary.weeklyAttendancePercent}%</li>
        <li><strong>Total Tasks Assigned:</strong> ${weeklySummary.totalTasksAssigned}</li>
        <li><strong>Total Tasks Completed:</strong> ${weeklySummary.totalTasksCompleted}</li>
        <li><strong>Total Tasks Pending:</strong> ${weeklySummary.totalTasksPending}</li>
        <li><strong>Overall Task Completion %:</strong> ${weeklySummary.weeklyCompletionPercent}%</li>
      </ul>
    </div>
    ${getEmailFooterHtml()}
  `;

  if (recipients.length === 0) {
    const history = await EmailNotificationHistory.create({
      notificationType: 'WEEKLY_TRAINING_REPORT',
      batchId,
      collegeId: batch.collegeId || null,
      recipients: [],
      subject,
      status: 'FAILED',
      attempts: 0,
      lastError: 'No HOD or Placement Officer email configured',
      hasPdfAttachment: true,
      payloadSnapshot: {
        weekStart: range.weekStart,
        weekEnd: range.weekEnd,
        overallTaskCompletionPercent: weeklySummary.weeklyCompletionPercent,
      },
    });
    return { skipped: true, reason: history.lastError, history, weeklySummary };
  }

  try {
    const res = await sendWithRetry({
      to: recipients,
      subject,
      html,
      text: `Weekly Training Report (${range.weekStart} to ${range.weekEnd}). Overall Completion: ${weeklySummary.weeklyCompletionPercent}%.`,
      attachments: [
        {
          filename: `weekly-training-report-${range.weekStart}_to_${range.weekEnd}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
      transportOverride: options.transport || null,
    });

    const history = await EmailNotificationHistory.findOneAndUpdate(
      dedupeKey ? { dedupeKey } : { _id: new (require('mongoose').Types.ObjectId)() },
      {
        $set: {
          notificationType: 'WEEKLY_TRAINING_REPORT',
          batchId,
          collegeId: batch.collegeId || null,
          recipients: recipientObjs,
          subject,
          status: 'SENT',
          attempts: res.attempts,
          lastError: '',
          hasPdfAttachment: true,
          payloadSnapshot: {
            weekStart: range.weekStart,
            weekEnd: range.weekEnd,
            overallTaskCompletionPercent: weeklySummary.weeklyCompletionPercent,
          },
          sentAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return { sent: true, history, weeklySummary };
  } catch (err) {
    const history = await EmailNotificationHistory.create({
      notificationType: 'WEEKLY_TRAINING_REPORT',
      batchId,
      collegeId: batch.collegeId || null,
      recipients: recipientObjs,
      subject,
      status: 'FAILED',
      attempts: 3,
      lastError: err.message,
      hasPdfAttachment: true,
      payloadSnapshot: { weekStart: range.weekStart, weekEnd: range.weekEnd },
    });
    return { sent: false, error: err.message, history, weeklySummary };
  }
}

/**
 * Checks if a temporary training student has completed ALL assigned tasks (assigned > 0 && pending === 0).
 * Sends an idempotent completion email to HOD and Placement Officer.
 */
async function checkAndSendCompletionEmail(studentId, options = {}) {
  const [user, profile, batch, tasks] = await Promise.all([
    User.findById(studentId).select('name email studentCategory studentType').lean(),
    StudentProfile.findOne({ userId: studentId }).lean(),
    Batch.findOne({ studentIds: studentId }).sort({ createdAt: -1 }).lean(),
    TrainingTaskAssignment.find({ studentId }).lean(),
  ]);

  if (!user) return { triggered: false, reason: 'Student not found' };
  const isTemp = user.studentCategory === 'TRAINING_TEMPORARY' || user.studentType === 'TRAINING_TEMPORARY';
  if (!isTemp) return { triggered: false, reason: 'Not a temporary training student' };

  const totalAssigned = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
  const pending = Math.max(0, totalAssigned - totalCompleted);

  if (totalAssigned === 0 || pending > 0) {
    return { triggered: false, reason: 'Tasks not all completed yet', totalAssigned, pending };
  }

  const batchKey = batch ? String(batch._id) : 'nobatch';
  const dedupeKey = `COMPLETION_${studentId}_${batchKey}_${totalAssigned}`;
  const existing = await EmailNotificationHistory.findOne({ dedupeKey, status: 'SENT' }).lean();
  if (existing) {
    return { triggered: false, skipped: true, reason: 'Completion email already sent', history: existing };
  }

  const collegeId = batch?.collegeId || profile?.collegeId || null;
  const college = collegeId ? await College.findById(collegeId).lean() : null;
  const { emails: recipients, recipientObjs } = await resolveRecipients(batch, college);
  const subject = `[${APP_NAME}] Student Training Task Completion — ${user.name}`;

  if (recipients.length === 0) {
    const history = await EmailNotificationHistory.create({
      notificationType: 'INDIVIDUAL_TASK_COMPLETION',
      studentId,
      batchId: batch?._id || null,
      collegeId,
      recipients: [],
      subject,
      status: 'FAILED',
      attempts: 0,
      lastError: 'No HOD or Placement Officer email configured',
      payloadSnapshot: { totalAssigned, totalCompleted },
    });
    return { triggered: true, skipped: true, history };
  }

  const html = `
    ${getEmailHeaderHtml('100% Training Task Completion', user.name)}
    <div style="font-family:Arial,sans-serif;color:#0F172A;padding:16px;">
      <p><strong>${user.name}</strong> (${college?.name || 'N/A'} — ${profile?.department || batch?.department || 'N/A'}) has completed <strong>all ${totalAssigned} assigned training tasks</strong> (100%).</p>
      <p><strong>Training Program:</strong> ${profile?.trainingName || batch?.batchName || batch?.name || 'Training'}</p>
      <p><strong>Completed At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
    ${getEmailFooterHtml()}
  `;

  try {
    const res = await sendWithRetry({
      to: recipients,
      subject,
      html,
      text: `${user.name} has completed all ${totalAssigned} assigned training tasks (100%).`,
      transportOverride: options.transport || null,
    });

    const history = await EmailNotificationHistory.findOneAndUpdate(
      { dedupeKey },
      {
        $set: {
          notificationType: 'INDIVIDUAL_TASK_COMPLETION',
          studentId,
          batchId: batch?._id || null,
          collegeId,
          recipients: recipientObjs,
          subject,
          status: 'SENT',
          attempts: res.attempts,
          lastError: '',
          hasPdfAttachment: false,
          payloadSnapshot: { totalAssigned, totalCompleted },
          sentAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return { triggered: true, sent: true, history };
  } catch (err) {
    const history = await EmailNotificationHistory.create({
      notificationType: 'INDIVIDUAL_TASK_COMPLETION',
      studentId,
      batchId: batch?._id || null,
      collegeId,
      recipients: recipientObjs,
      subject,
      status: 'FAILED',
      attempts: 3,
      lastError: err.message,
      payloadSnapshot: { totalAssigned, totalCompleted },
    });
    return { triggered: true, sent: false, error: err.message, history };
  }
}

module.exports = {
  generateWeeklyTrainingPdfBuffer,
  sendDailyTrainingReportEmail,
  sendWeeklyTrainingReportEmail,
  checkAndSendCompletionEmail,
};
