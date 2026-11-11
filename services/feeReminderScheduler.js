const FeePlan = require('../models/FeePlan');
const MonthlyInstallment = require('../models/MonthlyInstallment');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { sendPaymentNotification } = require('./paymentNotificationService');

/**
 * Fee Reminder & Monthly Billing Cycle Engine
 * 
 * Rules:
 * 1. Default monthly fee: ₹2,000.
 * 2. Active students with enrolled courses must have active FeePlans and current MonthlyInstallments.
 * 3. 3 days before monthly due date -> Send "3 Days Before Due" reminder.
 * 4. On due date if pending -> Send "Due Date Reminder".
 * 5. After due date if pending -> Send "Overdue Follow-Up" reminder.
 * 6. When paid -> reminders stop for that cycle and the next month's payment record is automatically generated.
 */
async function checkAndSendFeeReminders() {
  try {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Fetch all active student profiles that have an enrolled course
    const studentProfiles = await StudentProfile.find({
      enrolledCourseId: { $ne: null }
    }).populate('userId').populate('enrolledCourseId');

    const results = {
      processedStudents: 0,
      remindersSent: 0,
      newInstallmentsCreated: 0,
      errors: []
    };

    for (const profile of studentProfiles) {
      const user = profile.userId;
      const course = profile.enrolledCourseId;
      if (!user || user.role !== 'student' || user.isActive === false) continue;
      if (!course) continue;

      results.processedStudents++;

      const monthlyFee = profile.monthlyFee || 2000;
      const courseTitle = course.title || 'Academic Course';
      const courseDomain = course.domain || '';

      // Find or create active FeePlan for this student & course
      let feePlan = await FeePlan.findOne({
        studentId: user._id,
        courseId: course._id,
        status: 'Active'
      });

      if (!feePlan) {
        const planCount = await FeePlan.countDocuments();
        const planId = `FP-${user.studentId || 'STU'}-${Date.now().toString().slice(-4)}-${planCount + 1}`;
        feePlan = await FeePlan.create({
          planId,
          studentId: user._id,
          studentName: user.name,
          studentCode: user.studentId || 'STU1001',
          studentEmail: user.email,
          category: 'Courses',
          programId: course._id,
          courseId: course._id,
          domain: courseDomain,
          programName: courseTitle,
          programCode: `CRS-${courseTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`,
          batchId: profile.batchId || null,
          assignedTutorId: profile.assignedTutorId || null,
          totalAgreedFee: monthlyFee * 12,
          monthlyInstallmentAmount: monthlyFee,
          numberOfInstallments: 12,
          billingFrequency: 'Monthly',
          billingStartDate: profile.createdAt || new Date(),
          status: 'Active',
          isDummy: false
        });
      }

      // Find current pending or latest installment
      let activeInstallment = await MonthlyInstallment.findOne({
        feePlanId: feePlan._id,
        status: { $in: ['Pending', 'Partially Paid', 'Unpaid'] }
      }).sort({ installmentNumber: 1 });

      // If no pending installment exists, check if any installment exists at all
      if (!activeInstallment) {
        const latestInstallment = await MonthlyInstallment.findOne({
          feePlanId: feePlan._id
        }).sort({ installmentNumber: -1 });

        if (!latestInstallment) {
          // Generate Month 1 Installment (due 30 days from enrollment or next billing cycle)
          const dueDate = new Date(todayMidnight);
          dueDate.setDate(dueDate.getDate() + 30);

          const instCount = await MonthlyInstallment.countDocuments();
          const installmentId = `INST-${user.studentId || 'STU'}-01-${instCount + 1}`;

          activeInstallment = await MonthlyInstallment.create({
            installmentId,
            feePlanId: feePlan._id,
            studentId: user._id,
            studentName: user.name,
            studentCode: user.studentId || 'STU1001',
            category: 'Courses',
            programName: courseTitle,
            courseId: course._id,
            domain: courseDomain,
            installmentNumber: 1,
            dueDate,
            principalAmount: monthlyFee,
            principalPaid: 0,
            status: 'Pending',
            isDummy: false
          });
          results.newInstallmentsCreated++;
        }
      }

      // If we have an active pending installment, check reminder rules
      if (activeInstallment && activeInstallment.status !== 'Paid') {
        const dueDate = new Date(activeInstallment.dueDate);
        const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)); // e.g. 3 = due in 3 days, 0 = due today, -2 = 2 days overdue

        const dueDateFormatted = dueMidnight.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        const pendingAmount = Math.max(0, (activeInstallment.principalAmount || monthlyFee) - (activeInstallment.principalPaid || 0));

        // RULE 1: Send reminder 3 days before due date
        if (diffDays === 3) {
          const alreadySent = activeInstallment.lastReminderType === '3 Days Before Due' &&
            activeInstallment.lastReminderDate &&
            new Date(activeInstallment.lastReminderDate).toDateString() === now.toDateString();

          if (!alreadySent) {
            await sendPaymentNotification({
              recipientEmail: user.email || feePlan.studentEmail,
              recipientName: user.name,
              recipientType: 'Student',
              category: 'Courses',
              programName: courseTitle,
              reminderType: 'Monthly Pre-Due',
              amountDue: pendingAmount,
              principalDue: pendingAmount,
              dueDate: activeInstallment.dueDate,
              overdueDays: 0,
              installmentId: activeInstallment._id,
              feePlanId: feePlan._id,
              studentId: user._id,
              subject: `[STACK QUEUE] Course Fee Reminder: ₹${pendingAmount.toLocaleString('en-IN')} Due in 3 Days (${dueDateFormatted})`,
              messageBody: `Dear ${user.name},\n\nThis is a friendly reminder that your monthly course fee of ₹${pendingAmount.toLocaleString('en-IN')} for ${courseTitle} is due on ${dueDateFormatted}.\n\nPlease arrange for payment via UPI, Bank Transfer, or Cash.\n\nThank you,\nSTACK QUEUE Administration`,
              isDummy: false
            });

            await Notification.create({
              userId: user._id,
              title: 'Fee Payment Due in 3 Days',
              message: `Your monthly course fee of ₹${pendingAmount.toLocaleString('en-IN')} for ${courseTitle} is due on ${dueDateFormatted}.`,
              type: 'fee_reminder'
            });

            activeInstallment.lastReminderDate = now;
            activeInstallment.lastReminderType = 'Monthly Pre-Due';
            activeInstallment.reminderCount = (activeInstallment.reminderCount || 0) + 1;
            await activeInstallment.save();
            results.remindersSent++;
          }
        }
        // RULE 2: Send reminder on due date
        else if (diffDays === 0) {
          const alreadySent = activeInstallment.lastReminderType === 'Due Date Reminder' &&
            activeInstallment.lastReminderDate &&
            new Date(activeInstallment.lastReminderDate).toDateString() === now.toDateString();

          if (!alreadySent) {
            await sendPaymentNotification({
              recipientEmail: user.email || feePlan.studentEmail,
              recipientName: user.name,
              recipientType: 'Student',
              category: 'Courses',
              programName: courseTitle,
              reminderType: 'Due Date Reminder',
              amountDue: pendingAmount,
              principalDue: pendingAmount,
              dueDate: activeInstallment.dueDate,
              overdueDays: 0,
              installmentId: activeInstallment._id,
              feePlanId: feePlan._id,
              studentId: user._id,
              subject: `[STACK QUEUE] URGENT: Monthly Course Fee Due Today (₹${pendingAmount.toLocaleString('en-IN')})`,
              messageBody: `Dear ${user.name},\n\nToday (${dueDateFormatted}) is the due date for your monthly course fee of ₹${pendingAmount.toLocaleString('en-IN')} for ${courseTitle}.\n\nPlease complete your fee payment today to ensure uninterrupted course access.\n\nThank you,\nSTACK QUEUE Administration`,
              isDummy: false
            });

            await Notification.create({
              userId: user._id,
              title: 'Fee Payment Due Today',
              message: `Today is the due date for your ₹${pendingAmount.toLocaleString('en-IN')} fee for ${courseTitle}. Please submit payment.`,
              type: 'fee_reminder'
            });

            activeInstallment.lastReminderDate = now;
            activeInstallment.lastReminderType = 'Due Date Reminder';
            activeInstallment.reminderCount = (activeInstallment.reminderCount || 0) + 1;
            await activeInstallment.save();
            results.remindersSent++;
          }
        }
        // RULE 3: Send follow-up reminder after due date if still pending
        else if (diffDays < 0) {
          const overdueDays = Math.abs(diffDays);
          // Send follow up every 3 days during overdue
          const hoursSinceLastReminder = activeInstallment.lastReminderDate
            ? (now.getTime() - new Date(activeInstallment.lastReminderDate).getTime()) / (1000 * 60 * 60)
            : 999;

          if (hoursSinceLastReminder >= 48) {
            await sendPaymentNotification({
              recipientEmail: user.email || feePlan.studentEmail,
              recipientName: user.name,
              recipientType: 'Student',
              category: 'Courses',
              programName: courseTitle,
              reminderType: 'Overdue Notice',
              amountDue: pendingAmount,
              principalDue: pendingAmount,
              dueDate: activeInstallment.dueDate,
              overdueDays,
              installmentId: activeInstallment._id,
              feePlanId: feePlan._id,
              studentId: user._id,
              subject: `[STACK QUEUE] OVERDUE Notice: Course Fee Payment (${overdueDays} Day(s) Overdue - ₹${pendingAmount.toLocaleString('en-IN')})`,
              messageBody: `Dear ${user.name},\n\nYour monthly course fee payment of ₹${pendingAmount.toLocaleString('en-IN')} for ${courseTitle} was due on ${dueDateFormatted} and is now ${overdueDays} day(s) overdue.\n\nPlease clear your pending balance immediately.\n\nThank you,\nSTACK QUEUE Administration`,
              isDummy: false
            });

            await Notification.create({
              userId: user._id,
              title: 'Course Fee Payment Overdue',
              message: `Your course fee of ₹${pendingAmount.toLocaleString('en-IN')} is ${overdueDays} day(s) overdue. Please clear dues.`,
              type: 'fee_reminder'
            });

            activeInstallment.lastReminderDate = now;
            activeInstallment.lastReminderType = 'Overdue Notice';
            activeInstallment.overdueDays = overdueDays;
            activeInstallment.reminderCount = (activeInstallment.reminderCount || 0) + 1;
            await activeInstallment.save();
            results.remindersSent++;
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in checkAndSendFeeReminders:', error);
    throw error;
  }
}

/**
 * Automatically generate the next month's installment record when current installment is paid
 */
async function generateNextMonthInstallment(feePlanId, completedInstallmentNumber, completedDueDate) {
  try {
    const feePlan = await FeePlan.findById(feePlanId);
    if (!feePlan || feePlan.status !== 'Active') return null;

    const nextNumber = completedInstallmentNumber + 1;
    // Check if next installment already exists
    const existing = await MonthlyInstallment.findOne({
      feePlanId,
      installmentNumber: nextNumber
    });

    if (existing) return existing;

    const nextDueDate = new Date(completedDueDate || Date.now());
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const instCount = await MonthlyInstallment.countDocuments();
    const installmentId = `INST-${feePlan.studentCode || 'STU'}-${String(nextNumber).padStart(2, '0')}-${instCount + 1}`;

    const newInstallment = await MonthlyInstallment.create({
      installmentId,
      feePlanId: feePlan._id,
      studentId: feePlan.studentId,
      studentName: feePlan.studentName,
      studentCode: feePlan.studentCode,
      category: feePlan.category || 'Courses',
      programName: feePlan.programName,
      courseId: feePlan.courseId,
      domain: feePlan.domain,
      installmentNumber: nextNumber,
      dueDate: nextDueDate,
      principalAmount: feePlan.monthlyInstallmentAmount || 2000,
      principalPaid: 0,
      status: 'Pending',
      isDummy: false
    });

    return newInstallment;
  } catch (err) {
    console.error('generateNextMonthInstallment error:', err);
    return null;
  }
}

let schedulerTimer = null;

function initFeeReminderScheduler() {
  // Run once shortly after startup
  setTimeout(() => {
    checkAndSendFeeReminders().catch(err => console.error('Initial fee reminder check error:', err));
  }, 10000);

  // Run every 6 hours
  schedulerTimer = setInterval(() => {
    checkAndSendFeeReminders().catch(err => console.error('Scheduled fee reminder check error:', err));
  }, 6 * 60 * 60 * 1000);

  console.log('[Scheduler] Monthly Fee Reminder Engine initialized (checking every 6 hours).');
}

module.exports = {
  checkAndSendFeeReminders,
  generateNextMonthInstallment,
  initFeeReminderScheduler
};
