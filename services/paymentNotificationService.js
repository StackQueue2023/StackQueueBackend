const crypto = require('crypto');
const PaymentReminderLog = require('../models/PaymentReminderLog');

/**
 * Payment Notification Service
 *
 * Implements a development mock email provider / sink for testing.
 * Records all notification dispatches in PaymentReminderLog collection
 * and server logs without dispatching unwanted emails to real user inboxes.
 */

async function sendPaymentNotification({
  recipientEmail,
  recipientName,
  recipientType = 'Student',
  category,
  programName,
  reminderType,
  amountDue,
  principalDue,
  lateFeeDue,
  dueDate,
  overdueDays = 0,
  installmentId = null,
  feePlanId = null,
  studentId = null,
  tutorId = null,
  subject,
  messageBody,
  isDummy = true
}) {
  const reminderId = `REM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Log in dev console
  console.log(`[Mock Email Sink - Payment Notification]`);
  console.log(`  To:      ${recipientName} <${recipientEmail}> (${recipientType})`);
  console.log(`  Type:    ${reminderType}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Program: ${programName} (${category})`);
  console.log(`  Amount:  ₹${(amountDue || 0).toLocaleString('en-IN')}`);
  console.log(`  Status:  Delivered (Mock Sink)\n`);

  try {
    const logEntry = await PaymentReminderLog.create({
      reminderId,
      installmentId,
      feePlanId,
      studentId,
      tutorId,
      recipientEmail,
      recipientName,
      recipientType,
      category,
      programName,
      reminderType,
      amountDue: amountDue || 0,
      principalDue: principalDue || 0,
      lateFeeDue: lateFeeDue || 0,
      dueDate,
      overdueDays,
      status: 'Delivered (Mock Sink)',
      subject,
      messageBody: messageBody || `Notification for ${reminderType} regarding ${programName}.`,
      isDummy
    });

    return logEntry;
  } catch (err) {
    console.error('Error saving PaymentReminderLog:', err.message);
    return null;
  }
}

/**
 * Dispatch monthly student payment reminder (e.g. 3rd of month or pre-due)
 */
async function sendMonthlyStudentReminder({ student, installment, feePlan }) {
  const dueDateStr = new Date(installment.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const pDue = Math.max(0, (installment.principalAmount || 0) - (installment.principalPaid || 0));
  const lDue = Math.max(0, (installment.lateFeeAccrued || 0) - (installment.lateFeePaid || 0));
  const total = pDue + lDue;

  return sendPaymentNotification({
    recipientEmail: student.email || feePlan.studentEmail || 'student@stackqueue.demo',
    recipientName: student.name || feePlan.studentName,
    recipientType: 'Student',
    category: feePlan.category,
    programName: feePlan.programName,
    reminderType: 'Monthly Pre-Due',
    amountDue: total,
    principalDue: pDue,
    lateFeeDue: lDue,
    dueDate: installment.dueDate,
    overdueDays: 0,
    installmentId: installment._id,
    feePlanId: feePlan._id,
    studentId: student._id || feePlan.studentId,
    subject: `[STACK QUEUE] Monthly Fee Installment Reminder – ${feePlan.programName} (Due: ${dueDateStr})`,
    messageBody: `Dear ${student.name},\n\nYour monthly fee installment for ${feePlan.programName} is due on ${dueDateStr}.\nPrincipal Amount: ₹${pDue.toLocaleString('en-IN')}\nTotal Payable: ₹${total.toLocaleString('en-IN')}\n\nPlease submit your payment via the student portal.`
  });
}

/**
 * Dispatch payment receipt notification
 */
async function sendPaymentReceiptNotification({ receipt, student, transaction }) {
  return sendPaymentNotification({
    recipientEmail: student.email || receipt.studentEmail || 'student@stackqueue.demo',
    recipientName: student.name || receipt.studentName,
    recipientType: 'Student',
    category: receipt.category,
    programName: receipt.programName,
    reminderType: 'Payment Receipt',
    amountDue: receipt.remainingPrincipal,
    principalDue: receipt.remainingPrincipal,
    lateFeeDue: receipt.outstandingLateFees,
    dueDate: receipt.nextDueDate,
    overdueDays: 0,
    studentId: student._id || receipt.studentId,
    subject: `[STACK QUEUE] Official Fee Receipt #${receipt.receiptNumber} – ${receipt.programName}`,
    messageBody: `Dear ${student.name},\n\nWe have verified your payment of ₹${receipt.amountReceived.toLocaleString('en-IN')} for ${receipt.programName}.\nReceipt Number: ${receipt.receiptNumber}\nRemaining Balance: ₹${receipt.remainingPrincipal.toLocaleString('en-IN')}\n\nThank you for keeping your academic account in good standing.`
  });
}

module.exports = {
  sendPaymentNotification,
  sendMonthlyStudentReminder,
  sendPaymentReceiptNotification
};
