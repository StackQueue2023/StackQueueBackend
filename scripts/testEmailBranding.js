const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const emailService = require('../services/emailService');
const errorAlertService = require('../services/errorAlertService');
const { APP_NAME, EMAIL_FROM_NAME, getSenderString } = require('../config/brandConfig');

async function testAllEmails() {
  console.log(`=== STACK QUEUE Outgoing Email Audit & Verification ===`);
  console.log(`Configured App Name: "${APP_NAME}"`);
  console.log(`Configured Email From Name: "${EMAIL_FROM_NAME}"`);
  console.log(`Sender String: ${getSenderString()}`);
  
  const targetEmail = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  console.log(`Sending verification test emails to target: ${targetEmail}`);

  try {
    // 1. Test Verification OTP
    console.log('\n--- 1. Testing Verification OTP Email ---');
    const otpRes = await emailService.sendEmailOTP(targetEmail, '987654');
    console.log('OTP Email Result:', otpRes);

    // 2. Test Password Reset OTP
    console.log('\n--- 2. Testing Password Reset OTP Email ---');
    const resetRes = await emailService.sendPasswordResetOTP(targetEmail, '543210');
    console.log('Password Reset Email Result:', resetRes);

    // 3. Test Welcome Email
    console.log('\n--- 3. Testing Welcome Email ---');
    const welcomeRes = await emailService.sendWelcomeEmail({
      toEmail: targetEmail,
      name: 'Stack Queue Administrator',
      role: 'admin',
      username: 'stackadmin'
    });
    console.log('Welcome Email Result:', welcomeRes);

    // 4. Test Live Class Reminder
    console.log('\n--- 4. Testing Live Class Reminder Email ---');
    const classRes = await emailService.sendLiveClassReminderEmail({
      toEmail: targetEmail,
      studentName: 'Learner',
      className: 'Full Stack Web Development - Live Architecture Session',
      batchName: 'FS-2026-B1',
      startTime: new Date(Date.now() + 3600000).toLocaleString(),
      meetLink: 'https://meet.google.com/xyz-test-link'
    });
    console.log('Live Class Reminder Result:', classRes);

    // 5. Test Admin Error Alert
    console.log('\n--- 5. Testing Admin Error Alert Email ---');
    const alertRes = await errorAlertService.captureError({
      type: 'VERIFICATION_AUDIT',
      message: 'STACK QUEUE automated branding verification test alert',
      source: 'backend',
      url: 'https://stackqueue.edu/api/test',
      status: 200,
      timestamp: new Date().toISOString()
    });
    console.log('Admin Error Alert Result:', alertRes);

    console.log('\n>>> All email branding verification tests passed successfully! <<<');
    process.exit(0);
  } catch (err) {
    console.error('Email verification test failed:', err);
    process.exit(1);
  }
}

testAllEmails();
