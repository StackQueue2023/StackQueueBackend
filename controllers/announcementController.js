const Announcement = require('../models/Announcement');
const AnnouncementRecipient = require('../models/AnnouncementRecipient');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Setup Nodemailer Transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'stackqueue2023@gmail.com',
      pass: process.env.SMTP_PASS || ''
    }
  });
};

/**
 * 1. POST /api/announcements/send
 * Admin creates and sends an announcement to selected recipients via email + DB.
 */
exports.createAndSendAnnouncement = async (req, res) => {
  try {
    const { title, type, message, announcementDate, recipientType } = req.body;
    const createdBy = req.user._id;

    if (!title || !type || !message || !announcementDate || !recipientType) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, type, message, announcementDate, recipientType) are required.'
      });
    }

    // Determine target roles
    let roleFilter = {};
    if (recipientType === 'All Students') {
      roleFilter = { role: 'student' };
    } else if (recipientType === 'All Tutors') {
      roleFilter = { role: { $in: ['trainer', 'tutor'] } };
    } else {
      roleFilter = { role: { $in: ['student', 'trainer', 'tutor'] } };
    }

    // Fetch active users with valid email
    const users = await User.find(roleFilter).select('name email role');
    const validUsers = users.filter(u => u.email && u.email.includes('@'));

    // Create Announcement DB Record
    const announcement = await Announcement.create({
      title: title.trim(),
      type,
      message: message.trim(),
      announcementDate,
      recipientType,
      createdBy,
      recipientCount: validUsers.length,
      status: 'Sending'
    });

    // Send Emails via Nodemailer asynchronously
    let successfullySent = 0;
    let failedCount = 0;
    const transporter = createTransporter();

    const senderEmail = process.env.SMTP_USER || 'stackqueue2023@gmail.com';

    for (const u of validUsers) {
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">STACK QUEUE</h1>
              <p style="color: #fbcfe8; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">Inclusive Learning Platform</p>
            </div>
            
            <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 800;">Hello ${u.name},</h2>
            <h3 style="color: #8b5cf6; margin-top: 12px; margin-bottom: 16px; font-size: 20px; font-weight: 800;">${title}</h3>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 14px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap; border-left: 4px solid #ec4899;">${message}</div>
            
            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; display: flex; justify-content: space-between;">
              <p style="margin: 0;"><strong>Date:</strong> ${announcementDate}</p>
              <p style="margin: 0;"><strong>Category:</strong> <span style="background-color: #fdf2f8; color: #db2777; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;">${type}</span></p>
            </div>
            
            <div style="margin-top: 32px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
              <p style="margin: 0;">Regards,</p>
              <p style="margin: 4px 0 0 0; font-weight: 700; color: #64748b;">STACK QUEUE — Inclusive Learning</p>
            </div>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"STACK QUEUE" <${senderEmail}>`,
          to: u.email,
          subject: `[${type}] ${title} - STACK QUEUE`,
          html: htmlBody
        });

        successfullySent++;
        await AnnouncementRecipient.create({
          announcementId: announcement._id,
          userId: u._id,
          email: u.email,
          role: u.role,
          deliveryStatus: 'Sent',
          sentAt: new Date()
        });
      } catch (sendErr) {
        console.error(`Failed to send email to ${u.email}:`, sendErr.message);
        failedCount++;
        await AnnouncementRecipient.create({
          announcementId: announcement._id,
          userId: u._id,
          email: u.email,
          role: u.role,
          deliveryStatus: 'Failed',
          failureReason: sendErr.message || 'SMTP delivery failed'
        });
      }
    }

    // Update Announcement Summary
    announcement.successfullySent = successfullySent;
    announcement.failedCount = failedCount;
    announcement.status = failedCount === 0 ? 'Sent' : (successfullySent > 0 ? 'Sent' : 'Failed');
    await announcement.save();

    return res.json({
      success: true,
      message: `Announcement processed. ${successfullySent} sent successfully, ${failedCount} failed.`,
      data: {
        announcement,
        totalRecipients: validUsers.length,
        successfullySent,
        failedCount
      }
    });
  } catch (error) {
    console.error('createAndSendAnnouncement error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. GET /api/announcements/history (Admin view)
 */
exports.getAnnouncementHistory = async (req, res) => {
  try {
    const list = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('getAnnouncementHistory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. GET /api/announcements/student (Student view)
 */
exports.getStudentAnnouncements = async (req, res) => {
  try {
    const list = await Announcement.find({
      recipientType: { $in: ['All Students', 'Students + Tutors'] }
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('getStudentAnnouncements error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. GET /api/announcements/tutor (Tutor view)
 */
exports.getTutorAnnouncements = async (req, res) => {
  try {
    const list = await Announcement.find({
      recipientType: { $in: ['All Tutors', 'Students + Tutors'] }
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('getTutorAnnouncements error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
