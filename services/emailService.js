const nodemailer = require('nodemailer');
const { APP_NAME, getDefaultSender, getEmailHeaderHtml, getEmailFooterHtml, SUPPORT_EMAIL } = require('../config/brandConfig');

/**
 * Configure Nodemailer SMTP Transporter from environment variables
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const pass = process.env.SMTP_PASS || '';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const transporter = createTransporter();

/**
 * Verify SMTP connection configuration on module startup
 */
transporter.verify((error, _success) => {
  if (error) {
    console.error(`SMTP connection failed: ${error.message || error}`);
  } else {
    console.log(`[SMTP] Connection established successfully for ${APP_NAME}`);
  }
});

/**
 * Send real 6-digit Email Verification OTP via Nodemailer with STACK QUEUE Branding
 * @param {string} toEmail - Target recipient email
 * @param {string} otp - 6-digit verification code
 */
exports.sendEmailOTP = async (toEmail, otp) => {
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const pass = process.env.SMTP_PASS || '';

  if (!pass) {
    console.error('[EMAIL OTP] SMTP_PASS is missing in environment variables.');
    throw new Error('Unable to send verification email. Please try again.');
  }

  const cleanTarget = toEmail.trim().toLowerCase();

  const mailOptions = {
    from: {
      name: APP_NAME,
      address: user
    },
    to: cleanTarget,
    replyTo: user,
    subject: `${APP_NAME} - Email Verification Code`,
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High',
      'Importance': 'High'
    },
    text: `Hello,\n\nYour ${APP_NAME} email verification code is: ${otp}\n\nThis verification code expires in 5 minutes.\nIf you did not request this verification, please ignore this email.\n\nRegards,\n${APP_NAME} Learning Team\n${SUPPORT_EMAIL}`,
    html: `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; color: #1e293b;">
      ${getEmailHeaderHtml('Tutor & Trainer Onboarding Platform')}

      <div style="text-align: center; padding: 10px 0;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 12px;">Verify Your Email Address</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">Use the following 6-digit verification code to complete your ${APP_NAME} verification:</p>

        <div style="background-color: #f8fafc; display: inline-block; padding: 16px 32px; border-radius: 10px; margin: 16px 0; border: 2px dashed #8B2BE2;">
          <span style="font-family: 'Courier New', Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #8B2BE2;">${otp}</span>
        </div>

        <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 14px;">⏳ This verification code expires in 5 minutes.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 16px;">Do not share this verification code with anyone.</p>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] ${APP_NAME} Verification OTP sent to ${cleanTarget} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[${APP_NAME} EMAIL OTP SendMail Failure]:`, error);
    const { captureError } = require('./errorAlertService');
    captureError(error, {
      service: `${APP_NAME} Email Service`,
      severity: 'HIGH',
      impact: `Failed to deliver email verification OTP to ${cleanTarget}`
    }).catch(() => {});
    throw new Error('Unable to send verification email. Please try again.');
  }
};

/**
 * Send password reset OTP email with STACK QUEUE branding
 */
exports.sendPasswordResetOTP = async (toEmail, otp) => {
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const cleanTarget = (toEmail || '').trim().toLowerCase();
  if (!cleanTarget) return;

  const mailOptions = {
    from: {
      name: APP_NAME,
      address: user
    },
    to: cleanTarget,
    replyTo: user,
    subject: `${APP_NAME} - Password Reset Verification Code`,
    text: `Hello,\n\nYour ${APP_NAME} password reset 6-digit code is: ${otp}\n\nThis verification code expires in 15 minutes.\nIf you did not request a password reset, please ignore this email.\n\nRegards,\n${APP_NAME} Support Team`,
    html: `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; color: #1e293b;">
      ${getEmailHeaderHtml('Account Security & Password Recovery')}

      <div style="text-align: center; padding: 10px 0;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 12px;">Reset Your Password</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">Use the following 6-digit code to reset your ${APP_NAME} account password:</p>

        <div style="background-color: #f8fafc; display: inline-block; padding: 16px 32px; border-radius: 10px; margin: 16px 0; border: 2px dashed #8B2BE2;">
          <span style="font-family: 'Courier New', Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #8B2BE2;">${otp}</span>
        </div>

        <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 14px;">⏳ This reset code expires in 15 minutes.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 16px;">If you did not request a password reset, please secure your account immediately.</p>
      </div>

      ${getEmailFooterHtml()}
    </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] ${APP_NAME} Password Reset OTP sent to ${cleanTarget}`);
    return info;
  } catch (error) {
    console.error(`[${APP_NAME} Password Reset Error]:`, error);
  }
};

/**
 * Send welcome email to newly registered student or tutor
 */
exports.sendWelcomeEmail = async ({ toEmail, name, role = 'student', username }) => {
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const cleanTarget = (toEmail || '').trim().toLowerCase();
  if (!cleanTarget) return;

  const subject = `Welcome to ${APP_NAME} — Inclusive Learning Platform`;

  const mailOptions = {
    from: {
      name: APP_NAME,
      address: user
    },
    to: cleanTarget,
    replyTo: user,
    subject,
    text: `Welcome to ${APP_NAME}, ${name}!\n\nYour account has been successfully created as a ${role.toUpperCase()}.\nUsername: ${username}\nEmail: ${cleanTarget}\n\nLog in now at: ${process.env.CLIENT_URL || 'http://localhost:5173'}/login\n\nBest regards,\n${APP_NAME} Team`,
    html: `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; color: #1e293b;">
      ${getEmailHeaderHtml('Welcome to the Inclusive Learning Platform')}

      <div style="padding: 10px 0;">
        <h3 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 12px;">Welcome to ${APP_NAME}, ${name}! 🎉</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your ${APP_NAME} account is now active. You have full access to our industry-aligned learning tracks, real-time coding arenas, and live class modules.</p>

        <div style="background-color: #f8fafc; padding: 18px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.8;">
          <div>👤 <strong>Account Name:</strong> ${name}</div>
          <div>🔑 <strong>Username:</strong> ${username}</div>
          <div>📧 <strong>Registered Email:</strong> ${cleanTarget}</div>
          <div>🎓 <strong>Role:</strong> ${role.toUpperCase()}</div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" target="_blank" style="background-color: #8B2BE2; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(139, 43, 226, 0.3);">
            🚀 Log In to ${APP_NAME} Dashboard
          </a>
        </div>
      </div>

      ${getEmailFooterHtml()}
    </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] ${APP_NAME} Welcome Email sent to ${cleanTarget}`);
    return info;
  } catch (error) {
    console.error(`[${APP_NAME} Welcome Email Error]:`, error);
  }
};

/**
 * Send automated 30-minute Live Class Reminder email to Student/Tutor
 */
exports.sendLiveClassReminderEmail = async ({
  toEmail,
  recipientName,
  batchName,
  courseTitle,
  tutorName,
  topic,
  scheduledDate,
  startTime,
  endTime,
  meetingLink
}) => {
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const cleanTarget = (toEmail || '').trim().toLowerCase();
  if (!cleanTarget) return;

  const subject = `[${APP_NAME}] Live Class Reminder – ${topic || 'Online Class'}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; color: #1e293b;">
      ${getEmailHeaderHtml('Automated Live Class Notification')}

      <div style="padding: 10px 0;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 12px;">⏰ Live Class Starts in 30 Minutes!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>${recipientName || 'Learner'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your live class <strong>"${topic}"</strong> will start in 30 minutes on ${APP_NAME}. Please check your schedule and join on time.</p>

        <div style="background-color: #f8fafc; padding: 18px; border-radius: 10px; margin: 20px 0; border: 1px solid #cbd5e1; font-size: 13px; line-height: 1.8;">
          <div>📌 <strong>Topic:</strong> ${topic}</div>
          <div>📚 <strong>Course:</strong> ${courseTitle || 'N/A'}</div>
          ${batchName ? `<div>🎓 <strong>Batch:</strong> ${batchName}</div>` : ''}
          <div>👨‍🏫 <strong>Tutor:</strong> ${tutorName || 'N/A'}</div>
          <div>📅 <strong>Date:</strong> ${scheduledDate}</div>
          <div>⏰ <strong>Time:</strong> ${startTime} – ${endTime}</div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${meetingLink}" target="_blank" style="background-color: #8B2BE2; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(139, 43, 226, 0.3);">
            🚀 Join Live Class on ${APP_NAME}
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center;">Meeting Link: <a href="${meetingLink}" style="color: #8B2BE2;">${meetingLink}</a></p>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: {
        name: APP_NAME,
        address: user
      },
      to: cleanTarget,
      subject,
      html
    });
    console.log(`[Live Class Email Reminder] Sent to ${cleanTarget} for "${topic}"`);
    return info;
  } catch (error) {
    console.error(`[Live Class Email Reminder Error] Failed to send to ${cleanTarget}:`, error.message);
    const { captureError } = require('./errorAlertService');
    captureError(error, {
      service: `${APP_NAME} Email Service`,
      severity: 'HIGH',
      impact: `Failed to deliver live class reminder email to ${cleanTarget}`
    }).catch(() => {});
  }
};

/**
 * Send Course Enrollment Credentials Email to Student
 */
exports.sendCourseEnrollmentCredentialsEmail = async ({
  toEmail,
  studentName,
  studentId,
  courseName,
  batchName,
  collegeName,
  tutorName,
  username,
  password,
  startDate,
  mode,
  loginUrl
}) => {
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const cleanTarget = (toEmail || '').trim().toLowerCase();
  if (!cleanTarget) return null;

  const appLoginUrl = loginUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const subject = `[${APP_NAME}] Your Course Credentials: ${courseName} (${batchName})`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; color: #1e293b;">
      ${getEmailHeaderHtml('Course Enrollment & Credentials')}

      <div style="padding: 10px 0;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 12px;">🎉 You have been enrolled in a New Course!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>${studentName || 'Student'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">You have been assigned to <strong>${courseName}</strong> under batch <strong>${batchName}</strong> (${collegeName || APP_NAME}). Below are your official course-specific login credentials:</p>

        <!-- Credentials Box -->
        <div style="background-color: #faf5ff; border: 2px dashed #a855f7; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
          <div style="font-size: 13px; color: #6b21a8; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">🔐 Course Login Credentials</div>
          <div style="margin: 6px 0; font-size: 14px;"><strong>Course:</strong> <span style="color: #7e22ce;">${courseName}</span></div>
          <div style="margin: 6px 0; font-size: 14px;"><strong>Student ID:</strong> <span style="color: #7e22ce; font-family: monospace;">${studentId || 'Permanent'}</span></div>
          <div style="margin: 6px 0; font-size: 14px;"><strong>Username:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #581c87; background: #f3e8ff; padding: 2px 8px; border-radius: 4px;">${username}</span></div>
          <div style="margin: 6px 0; font-size: 14px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #581c87; background: #f3e8ff; padding: 2px 8px; border-radius: 4px;">${password}</span></div>
          <div style="margin: 6px 0; font-size: 12px; color: #7e22ce;"><em>Note: Access to this course is active during your training cycle. Credentials will automatically be deactivated upon official course completion.</em></div>
        </div>

        <div style="background-color: #f8fafc; padding: 16px; border-radius: 10px; margin: 16px 0; border: 1px solid #cbd5e1; font-size: 13px; line-height: 1.8;">
          <div>📚 <strong>Batch:</strong> ${batchName}</div>
          <div>🏛️ <strong>College:</strong> ${collegeName || 'N/A'}</div>
          <div>👨‍🏫 <strong>Assigned Tutor:</strong> ${tutorName || 'Assigned Instructor'}</div>
          <div>💻 <strong>Mode:</strong> ${mode || 'ONLINE'}</div>
          ${startDate ? `<div>📅 <strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</div>` : ''}
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${appLoginUrl}" target="_blank" style="background: linear-gradient(135deg, #8B2BE2, #EC4899); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(139, 43, 226, 0.3);">
            🚀 Login to ${APP_NAME}
          </a>
        </div>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: {
        name: APP_NAME,
        address: user
      },
      to: cleanTarget,
      subject,
      html
    });
    console.log(`[Course Credentials Email] Sent to ${cleanTarget} for course "${courseName}"`);
    return info;
  } catch (error) {
    console.error(`[Course Credentials Email Error] Failed to send to ${cleanTarget}:`, error.message);
  }
};

exports.verifySMTPConnection = () => {
  return new Promise((resolve) => {
    transporter.verify((err, success) => {
      if (err) {
        console.error(`SMTP connection failed: ${err.message || err}`);
        resolve(false);
      } else {
        console.log(`SMTP connection successful for ${APP_NAME}`);
        resolve(true);
      }
    });
  });
};
