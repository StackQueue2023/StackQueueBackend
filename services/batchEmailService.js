const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { APP_NAME } = require('../config/brandConfig');
const Batch = require('../models/Batch');
const BatchDailyReport = require('../models/BatchDailyReport');
const EmailLog = require('../models/EmailLog');

/**
 * Creates nodemailer transporter.
 */
const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback to jsonTransport or streamTransport for development/testing if SMTP credentials not configured
  return nodemailer.createTransport({
    jsonTransport: true
  });
};

/**
 * Send Daily Progress Report Email with PDF attachment to college contacts & tutor.
 * @param {string} reportId 
 */
exports.sendDailyReportEmail = async (reportId) => {
  const report = await BatchDailyReport.findById(reportId).populate({
    path: 'batchId',
    populate: [
      { path: 'collegeId', select: 'name city code' },
      { path: 'trainerId', select: 'name email' }
    ]
  });

  if (!report || !report.batchId) {
    throw new Error(`Report or Batch not found for reportId ${reportId}`);
  }

  const batch = report.batchId;
  const recipients = [];

  if (batch.collegeGuideEmail) recipients.push(batch.collegeGuideEmail.trim());
  if (batch.placementOfficeEmail) recipients.push(batch.placementOfficeEmail.trim());
  if (batch.hodEmail) recipients.push(batch.hodEmail.trim());
  if (batch.trainerId?.email) recipients.push(batch.trainerId.email.trim());

  // Unique recipient list
  const uniqueRecipients = Array.from(new Set(recipients)).filter(Boolean);

  if (uniqueRecipients.length === 0) {
    console.warn(`[BatchEmailService] No recipient emails configured for batch ${batch.code}. Skipping email delivery.`);
    await EmailLog.create({
      batchId: batch._id,
      reportId: report._id,
      date: report.date,
      recipients: [],
      subject: `Daily Training Report - ${batch.name} (${report.date})`,
      status: 'FAILED',
      errorDetails: 'No valid recipient email addresses specified in batch config.'
    });
    return;
  }

  // Check PDF file existence
  const pdfFullPath = path.join(__dirname, '..', report.pdfPath);
  let attachments = [];
  if (fs.existsSync(pdfFullPath)) {
    attachments.push({
      filename: `Daily_Training_Report_${batch.code}_${report.date}.pdf`,
      path: pdfFullPath
    });
  } else {
    console.warn(`[BatchEmailService] PDF file not found at ${pdfFullPath}`);
  }

  const transporter = getTransporter();

  const subject = `[${APP_NAME}] Daily Training Progress Report - ${batch.name} (${report.date})`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">${APP_NAME} — Daily Training Progress Report</h2>
          <p style="margin: 5px 0 0 0; color: #38bdf8; font-size: 14px;">${batch.collegeId?.name || ''} | ${batch.name}</p>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p>Dear Partners & Program Leads,</p>
          <p>Please find attached the automated Daily Training Progress Report for <strong>${batch.name} (${batch.code})</strong> for <strong>${report.date}</strong>.</p>
          
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0f172a;">Daily Key Metrics Summary</h4>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0;"><strong>Enrolled Students:</strong></td>
                <td style="text-align: right;">${report.statsSnapshot.totalStudents}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Present Today:</strong></td>
                <td style="text-align: right; color: #16a34a;">${report.statsSnapshot.presentCount}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Absent Today:</strong></td>
                <td style="text-align: right; color: #dc2626;">${report.statsSnapshot.absentCount}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Tasks Completed Today:</strong></td>
                <td style="text-align: right;">${report.statsSnapshot.totalTasksCompletedToday}</td>
              </tr>
            </table>
          </div>

          <p><strong>Topic Covered Today:</strong> ${report.topicCovered || 'Practical domain training and exercises.'}</p>
          <p>The detailed student progress table and attendance logs are attached in the PDF document.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This email was sent automatically by ${APP_NAME} Training Batch Management System.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'stackqueue2023@gmail.com';
    const mailOptions = {
      from: {
        name: APP_NAME,
        address: senderEmail
      },
      to: uniqueRecipients.join(', '),
      subject,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);

    const emailLog = await EmailLog.create({
      batchId: batch._id,
      reportId: report._id,
      date: report.date,
      recipients: uniqueRecipients,
      subject,
      status: 'SENT',
      sentAt: new Date()
    });

    console.log(`[BatchEmailService] Email sent successfully for report ${report._id} to [${uniqueRecipients.join(', ')}]`);
    return emailLog;
  } catch (error) {
    console.error(`[BatchEmailService] Failed to send email for report ${report._id}:`, error);

    const emailLog = await EmailLog.create({
      batchId: batch._id,
      reportId: report._id,
      date: report.date,
      recipients: uniqueRecipients,
      subject,
      status: 'FAILED',
      errorDetails: error.message
    });

    return emailLog;
  }
};
