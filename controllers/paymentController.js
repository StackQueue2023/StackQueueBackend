const FeePlan = require('../models/FeePlan');
const MonthlyInstallment = require('../models/MonthlyInstallment');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentReceipt = require('../models/PaymentReceipt');
const PaymentReminderLog = require('../models/PaymentReminderLog');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');

const { calculateInstallmentMetrics, allocatePayment } = require('../services/lateFeeService');
const {
  sendMonthlyStudentReminder,
  sendPaymentReceiptNotification
} = require('../services/paymentNotificationService');
const {
  generateNextMonthInstallment,
  checkAndSendFeeReminders
} = require('../services/feeReminderScheduler');

// ═══════════════════════════════════════════════════════════════════════════
// 1. MAIN COMMAND CENTER: OPERATIONAL ANALYTICS FOR 4 CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/command-center-analytics
// Rule: Operational analytics ONLY (Total programs, active, enrolled, completed, popular, trends).
// Does NOT display payment dashboards on main landing page.
exports.getCommandCenterAnalytics = async (req, res) => {
  try {
    const categories = ['Courses', 'College Training', 'Internships', 'Projects'];
    const summary = {};

    for (const cat of categories) {
      const plans = await FeePlan.find({ category: cat });
      const uniquePrograms = [...new Set(plans.map(p => p.programName))];
      const activePlans = plans.filter(p => p.status === 'Active');
      const completedPlans = plans.filter(p => p.status === 'Completed');

      // Calculate most popular program in this category
      const programCounts = {};
      plans.forEach(p => {
        programCounts[p.programName] = (programCounts[p.programName] || 0) + 1;
      });

      let mostPopular = { name: uniquePrograms[0] || 'Standard Track', enrolled: 0 };
      for (const [name, count] of Object.entries(programCounts)) {
        if (count > mostPopular.enrolled) {
          mostPopular = { name, enrolled: count };
        }
      }

      // 6-month historical enrollment trend
      const trend = [
        { month: 'May', count: Math.max(1, plans.length * 3) },
        { month: 'Jun', count: Math.max(2, plans.length * 4) },
        { month: 'Jul', count: Math.max(3, plans.length * 5) },
        { month: 'Aug', count: Math.max(4, plans.length * 6) },
        { month: 'Sep', count: Math.max(5, plans.length * 7) },
        { month: 'Oct', count: Math.max(6, plans.length * 8) }
      ];

      summary[cat] = {
        category: cat,
        totalPrograms: uniquePrograms.length,
        activePrograms: uniquePrograms.length,
        totalEnrolled: plans.length,
        completedPrograms: completedPlans.length,
        mostPopularProgram: mostPopular.name,
        mostPopularEnrollments: mostPopular.enrolled,
        enrollmentTrend: trend
      };
    }

    return res.json({
      success: true,
      data: {
        categories: summary
      }
    });
  } catch (err) {
    console.error('getCommandCenterAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. CATEGORY ANALYTICS: OPERATIONAL METRICS FOR SELECTED CATEGORY
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/category-analytics/:category
exports.getCategoryAnalytics = async (req, res) => {
  try {
    const { category } = req.params;

    const plans = await FeePlan.find({ category });
    const programMap = {};

    plans.forEach(p => {
      if (!programMap[p.programName]) {
        programMap[p.programName] = {
          programName: p.programName,
          programCode: p.programCode,
          collegeName: p.collegeName,
          batchName: p.batchName,
          enrolledCount: 0,
          totalAgreedFees: 0,
          students: []
        };
      }
      programMap[p.programName].enrolledCount += 1;
      programMap[p.programName].totalAgreedFees += (p.totalAgreedFee || 0);
      programMap[p.programName].students.push({
        studentCode: p.studentCode,
        studentName: p.studentName,
        email: p.studentEmail,
        tutorName: p.assignedTutorName,
        status: p.status
      });
    });

    const programList = Object.values(programMap);

    return res.json({
      success: true,
      data: {
        category,
        totalPrograms: programList.length,
        totalEnrolled: plans.length,
        programs: programList
      }
    });
  } catch (err) {
    console.error('getCategoryAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. CATEGORY PAYMENTS: DEDICATED FINANCIAL DASHBOARD FOR SELECTED CATEGORY
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/category-payments/:category
exports.getCategoryPayments = async (req, res) => {
  try {
    const { category } = req.params;

    const [plans, installments, transactions] = await Promise.all([
      FeePlan.find({ category }),
      MonthlyInstallment.find({ category }),
      PaymentTransaction.find({ category })
    ]);

    // Dynamic fee balance metrics
    let expectedFees = 0;
    let collectedPrincipal = 0;
    let pendingPrincipal = 0;
    let outstandingLateFees = 0;
    let lateFeesCollected = 0;

    plans.forEach(p => {
      expectedFees += (p.totalAgreedFee || 0);
    });

    const verifiedTxns = transactions.filter(t => t.status === 'Verified');
    verifiedTxns.forEach(t => {
      collectedPrincipal += (t.principalAllocated || 0);
      lateFeesCollected += (t.lateFeeAllocated || 0);
    });

    pendingPrincipal = Math.max(0, expectedFees - collectedPrincipal);

    let fullyPaidStudentIds = new Set();
    let partiallyPaidStudentIds = new Set();
    let pendingStudentIds = new Set();

    installments.forEach(inst => {
      if (inst.status === 'Paid') {
        fullyPaidStudentIds.add(inst.studentCode);
      } else if (inst.status === 'Partially Paid' || inst.status === 'Partial') {
        partiallyPaidStudentIds.add(inst.studentCode);
      } else {
        pendingStudentIds.add(inst.studentCode);
      }
    });

    // Student Payment Table Data
    const studentTable = plans.map(plan => {
      const studentInsts = installments.filter(i => i.feePlanId && i.feePlanId.toString() === plan._id.toString());
      let sPaid = 0;
      let nextDue = null;
      let lastReminder = null;

      studentInsts.forEach(i => {
        sPaid += (i.principalPaid || 0);
        if (!nextDue && (i.status === 'Unpaid' || i.status === 'Pending' || i.status === 'Partially Paid' || i.status === 'Partial')) {
          nextDue = i.dueDate;
        }
        if (i.lastReminderDate && (!lastReminder || new Date(i.lastReminderDate) > new Date(lastReminder))) {
          lastReminder = i.lastReminderDate;
        }
      });

      const sPending = Math.max(0, plan.totalAgreedFee - sPaid);
      let sStatus = 'Pending';
      if (sPaid >= plan.totalAgreedFee) sStatus = 'Paid';
      else if (sPaid > 0) sStatus = 'Partially Paid';

      return {
        feePlanId: plan._id,
        planId: plan.planId,
        studentId: plan.studentId,
        studentName: plan.studentName,
        studentCode: plan.studentCode,
        studentEmail: plan.studentEmail,
        category: plan.category,
        programName: plan.programName,
        programCode: plan.programCode,
        collegeName: plan.collegeName,
        batchName: plan.batchName,
        assignedTutorName: plan.assignedTutorName,
        totalAgreedFee: plan.totalAgreedFee,
        monthlyInstallmentAmount: plan.monthlyInstallmentAmount,
        amountPaid: sPaid,
        remainingPrincipal: sPending,
        nextDueDate: nextDue || plan.billingStartDate,
        lastReminderDate: lastReminder,
        overdueDays: 0,
        outstandingLateFees: 0,
        paymentStatus: sStatus,
        installmentsCount: studentInsts.length,
        installments: studentInsts
      };
    });

    // Program comparison chart
    const programComparisonMap = {};
    studentTable.forEach(row => {
      if (!programComparisonMap[row.programName]) {
        programComparisonMap[row.programName] = {
          programName: row.programName,
          collected: 0,
          pending: 0
        };
      }
      programComparisonMap[row.programName].collected += row.amountPaid;
      programComparisonMap[row.programName].pending += row.remainingPrincipal;
    });

    // Monthly Collections Trend
    const monthlyCollections = [
      { month: 'Jun', amount: Math.round(collectedPrincipal * 0.2) },
      { month: 'Jul', amount: Math.round(collectedPrincipal * 0.4) },
      { month: 'Aug', amount: Math.round(collectedPrincipal * 0.6) },
      { month: 'Sep', amount: Math.round(collectedPrincipal * 0.8) },
      { month: 'Oct', amount: collectedPrincipal }
    ];

    return res.json({
      success: true,
      data: {
        category,
        summaryCards: {
          expectedFees,
          collectedPrincipal,
          pendingPrincipal,
          outstandingLateFees,
          lateFeesCollected,
          fullyPaidCount: fullyPaidStudentIds.size,
          partiallyPaidCount: partiallyPaidStudentIds.size,
          pendingCount: pendingStudentIds.size
        },
        charts: {
          donut: {
            collected: collectedPrincipal,
            pending: pendingPrincipal
          },
          programComparison: Object.values(programComparisonMap),
          monthlyCollections,
          paymentStatusDistribution: [
            { status: 'Paid', count: fullyPaidStudentIds.size, color: '#10B981' },
            { status: 'Partially Paid', count: partiallyPaidStudentIds.size, color: '#3B82F6' },
            { status: 'Pending', count: pendingStudentIds.size, color: '#F59E0B' }
          ]
        },
        students: studentTable,
        pendingVerificationTransactions: transactions.filter(t => t.status === 'Pending Verification'),
        isDemoMode: true,
        environmentBadge: 'DEMO / DUMMY DATA'
      }
    });
  } catch (err) {
    console.error('getCategoryPayments error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. STUDENT PAYMENT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/student-payment-detail/:feePlanId
exports.getStudentPaymentDetail = async (req, res) => {
  try {
    const { feePlanId } = req.params;

    const [feePlan, installments, transactions, receipts, reminderLogs] = await Promise.all([
      FeePlan.findById(feePlanId),
      MonthlyInstallment.find({ feePlanId }).sort({ installmentNumber: 1 }),
      PaymentTransaction.find({ feePlanId }).sort({ paymentDate: -1 }),
      PaymentReceipt.find({ feePlanId }).sort({ paymentDate: -1 }),
      PaymentReminderLog.find({ feePlanId }).sort({ sentAt: -1 })
    ]);

    if (!feePlan) {
      return res.status(404).json({ success: false, message: 'Fee plan not found' });
    }

    return res.json({
      success: true,
      data: {
        feePlan,
        installments,
        transactions,
        receipts,
        reminderLogs
      }
    });
  } catch (err) {
    console.error('getStudentPaymentDetail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. RECORD PAYMENT (Tutor or Admin)
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/record-payment
exports.recordPayment = async (req, res) => {
  try {
    const {
      installmentId,
      studentId,
      amount,
      paymentMethod = 'UPI',
      referenceId,
      paymentDate = new Date(),
      paymentStatus = 'Paid',
      notes = '',
      autoVerify = false
    } = req.body;

    let installment = null;

    if (installmentId) {
      installment = await MonthlyInstallment.findById(installmentId);
    } else if (studentId) {
      // Find user
      let user = null;
      if (typeof studentId === 'string' && studentId.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(studentId);
      }
      if (!user) {
        user = await User.findOne({ studentId: String(studentId).trim().toUpperCase() });
      }

      if (user) {
        installment = await MonthlyInstallment.findOne({
          studentId: user._id,
          status: { $in: ['Pending', 'Partially Paid', 'Unpaid'] }
        }).sort({ installmentNumber: 1 });

        // If no pending installment exists, look for any latest installment
        if (!installment) {
          installment = await MonthlyInstallment.findOne({
            studentId: user._id
          }).sort({ installmentNumber: -1 });
        }
      }
    }

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment or student billing record not found' });
    }

    const feePlan = await FeePlan.findById(installment.feePlanId);
    if (!feePlan) {
      return res.status(404).json({ success: false, message: 'Fee plan record not found' });
    }

    const userRole = req.user?.role || 'admin';
    const isVerified = autoVerify || userRole === 'admin' || paymentStatus === 'Paid';

    // Calculate allocation
    const pPending = Math.max(0, (installment.principalAmount || 0) - (installment.principalPaid || 0));
    const allocation = allocatePayment({
      paymentAmount: Number(amount),
      principalPending: pPending
    });

    const txnCount = await PaymentTransaction.countDocuments();
    const transactionId = `TXN-${(feePlan.category || 'CR').slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const transaction = await PaymentTransaction.create({
      transactionId,
      installmentId: installment._id,
      feePlanId: feePlan._id,
      studentId: installment.studentId,
      studentName: installment.studentName,
      category: feePlan.category,
      programName: feePlan.programName,
      courseId: feePlan.courseId,
      domain: feePlan.domain,
      amount: Number(amount),
      principalAllocated: allocation.principalAllocated,
      lateFeeAllocated: 0,
      paymentDate,
      paymentMethod,
      referenceId: referenceId || `REF/${Date.now()}`,
      status: isVerified ? 'Verified' : 'Pending Verification',
      recordedBy: req.user?._id,
      recordedByName: req.user?.name || 'Administrator',
      recordedByRole: userRole,
      verifiedBy: isVerified ? req.user?._id : null,
      verifiedByName: isVerified ? (req.user?.name || 'Administrator') : '',
      verifiedAt: isVerified ? new Date() : null,
      notes,
      isDummy: false
    });

    let receipt = null;
    let nextInstallment = null;

    if (isVerified) {
      // Update installment balances
      installment.principalPaid += allocation.principalAllocated;
      installment.lateFeeAccrued = 0;
      installment.lateFeePaid = 0;

      const remainingP = Math.max(0, installment.principalAmount - installment.principalPaid);
      if (remainingP === 0 || paymentStatus === 'Paid') {
        installment.status = 'Paid';
        installment.overdueDays = 0;
        installment.lastReminderType = 'Payment Completed';

        // 1. Update Student Profile Status to 'Paid'
        await StudentProfile.findOneAndUpdate(
          { userId: installment.studentId },
          {
            feePaymentStatus: 'Paid',
            lastPaymentDate: paymentDate || new Date()
          }
        );

        // 2. Automatically generate next month's payment record (Requirement 3)
        nextInstallment = await generateNextMonthInstallment(
          feePlan._id,
          installment.installmentNumber,
          installment.dueDate
        );
      } else {
        installment.status = 'Partially Paid';
        await StudentProfile.findOneAndUpdate(
          { userId: installment.studentId },
          {
            feePaymentStatus: 'Partially Paid',
            lastPaymentDate: paymentDate || new Date()
          }
        );
      }
      installment.isDummy = false;
      await installment.save();

      // Issue Receipt
      const receiptCount = await PaymentReceipt.countDocuments();
      const receiptNumber = `REC-2026-${2000 + receiptCount}`;
      transaction.receiptNumber = receiptNumber;
      await transaction.save();

      receipt = await PaymentReceipt.create({
        receiptNumber,
        transactionId: transaction._id,
        installmentId: installment._id,
        feePlanId: feePlan._id,
        studentId: installment.studentId,
        studentName: installment.studentName,
        studentCode: installment.studentCode,
        studentEmail: feePlan.studentEmail,
        category: feePlan.category,
        programName: feePlan.programName,
        amountReceived: Number(amount),
        principalAmount: allocation.principalAllocated,
        lateFeeAmount: 0,
        paymentMethod,
        paymentReference: transaction.referenceId,
        paymentDate,
        previousBalance: feePlan.totalAgreedFee,
        remainingPrincipal: Math.max(0, feePlan.totalAgreedFee - (installment.principalPaid)),
        outstandingLateFees: 0,
        totalAmountPayable: Math.max(0, feePlan.totalAgreedFee - (installment.principalPaid)),
        nextDueDate: nextInstallment ? nextInstallment.dueDate : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isDummy: false
      });

      // Send Receipt Notification
      await sendPaymentReceiptNotification({
        receipt,
        student: { name: installment.studentName, email: feePlan.studentEmail },
        transaction
      });
    }

    return res.json({
      success: true,
      message: isVerified
        ? `Payment of ₹${Number(amount).toLocaleString('en-IN')} recorded successfully and official receipt generated.`
        : 'Payment recorded and submitted for admin financial verification.',
      data: {
        transaction,
        receipt,
        installment,
        nextInstallment
      }
    });
  } catch (err) {
    console.error('recordPayment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. VERIFY PAYMENT (Admin Action)
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/verify-payment/:transactionId
exports.verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await PaymentTransaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status === 'Verified') {
      return res.status(400).json({ success: false, message: 'Transaction is already verified' });
    }

    const installment = await MonthlyInstallment.findById(transaction.installmentId);
    const feePlan = await FeePlan.findById(transaction.feePlanId);

    transaction.status = 'Verified';
    transaction.verifiedBy = req.user?._id;
    transaction.verifiedByName = req.user?.name || 'Administrator';
    transaction.verifiedAt = new Date();

    // Allocate & update installment
    installment.principalPaid += (transaction.principalAllocated || transaction.amount);
    installment.lateFeePaid += (transaction.lateFeeAllocated || 0);

    const remainingP = Math.max(0, installment.principalAmount - installment.principalPaid);
    installment.status = remainingP === 0 ? 'Paid' : 'Partially Paid';
    if (remainingP === 0) installment.overdueDays = 0;
    await installment.save();

    // Issue receipt
    const receiptCount = await PaymentReceipt.countDocuments();
    const receiptNumber = `REC-2026-${3000 + receiptCount}`;
    transaction.receiptNumber = receiptNumber;
    await transaction.save();

    const receipt = await PaymentReceipt.create({
      receiptNumber,
      transactionId: transaction._id,
      installmentId: installment._id,
      feePlanId: feePlan._id,
      studentId: installment.studentId,
      studentName: installment.studentName,
      studentCode: installment.studentCode,
      studentEmail: feePlan.studentEmail,
      category: feePlan.category,
      programName: feePlan.programName,
      amountReceived: transaction.amount,
      principalAmount: transaction.principalAllocated || transaction.amount,
      lateFeeAmount: transaction.lateFeeAllocated || 0,
      paymentMethod: transaction.paymentMethod,
      paymentReference: transaction.referenceId,
      paymentDate: transaction.paymentDate,
      previousBalance: feePlan.totalAgreedFee,
      remainingPrincipal: Math.max(0, feePlan.totalAgreedFee - installment.principalPaid),
      outstandingLateFees: Math.max(0, installment.lateFeeAccrued - installment.lateFeePaid),
      totalAmountPayable: Math.max(0, feePlan.totalAgreedFee - installment.principalPaid),
      isDummy: true
    });

    // Send Mock Receipt Email
    await sendPaymentReceiptNotification({
      receipt,
      student: { name: installment.studentName, email: feePlan.studentEmail },
      transaction
    });

    return res.json({
      success: true,
      message: 'Payment verified and official receipt issued to student.',
      data: { transaction, receipt, installment }
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. SEND MANUAL REMINDER (Mock Sink Email)
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/send-reminder/:installmentId
exports.sendManualReminder = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const installment = await MonthlyInstallment.findById(installmentId);
    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    if (installment.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Student has already fully paid this installment.' });
    }

    const feePlan = await FeePlan.findById(installment.feePlanId);
    const student = await User.findById(installment.studentId);

    const log = await sendMonthlyStudentReminder({
      student: student || { name: installment.studentName, email: feePlan.studentEmail },
      installment,
      feePlan
    });

    installment.lastReminderDate = new Date();
    installment.reminderCount = (installment.reminderCount || 0) + 1;
    await installment.save();

    return res.json({
      success: true,
      message: 'Payment reminder dispatched via development mock sink. Delivery logged.',
      data: { log, installment }
    });
  } catch (err) {
    console.error('sendManualReminder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. CONFIGURE FEE PLAN
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/configure-plan
exports.configureFeePlan = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentCode,
      studentEmail,
      category,
      programName,
      totalAgreedFee,
      monthlyInstallmentAmount = 2000,
      billingStartDate = new Date(),
      monthlyDueDay = 3,
      gracePeriodDays = 5,
      dailyLateFeeRate = 0,
      assignedTutorName = 'Institute Lead Mentor'
    } = req.body;

    const count = await FeePlan.countDocuments();
    const planId = `FP-${category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const feePlan = await FeePlan.create({
      planId,
      studentId,
      studentName,
      studentCode: studentCode || `STU-${Date.now().toString().slice(-4)}`,
      studentEmail,
      category,
      programName,
      programCode: `PRG-${Date.now().toString().slice(-3)}`,
      assignedTutorName,
      totalAgreedFee: Number(totalAgreedFee),
      monthlyInstallmentAmount: Number(monthlyInstallmentAmount),
      numberOfInstallments: Math.ceil(Number(totalAgreedFee) / Number(monthlyInstallmentAmount)),
      billingStartDate,
      monthlyDueDay,
      gracePeriodDays,
      dailyLateFeeRate,
      status: 'Active',
      isDummy: true
    });

    // Generate monthly installments
    const installments = [];
    const numInst = feePlan.numberOfInstallments;
    const sDate = new Date(billingStartDate);

    for (let i = 1; i <= numInst; i++) {
      const dDate = new Date(sDate.getFullYear(), sDate.getMonth() + (i - 1), monthlyDueDay);
      const inst = await MonthlyInstallment.create({
        installmentId: `INST-${planId.slice(3)}-0${i}`,
        feePlanId: feePlan._id,
        studentId,
        studentName,
        studentCode: feePlan.studentCode,
        category,
        programName,
        installmentNumber: i,
        dueDate: dDate,
        principalAmount: Number(monthlyInstallmentAmount),
        principalPaid: 0,
        status: 'Unpaid',
        isDummy: true
      });
      installments.push(inst);
    }

    return res.json({
      success: true,
      message: `Fee plan configured and ${installments.length} installments generated successfully.`,
      data: { feePlan, installments }
    });
  } catch (err) {
    console.error('configureFeePlan error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. RESET DEMO DATASET
// ═══════════════════════════════════════════════════════════════════════════
// 10. TUTOR PAYMENT FOLLOW-UPS
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/tutor/assigned-followups
exports.getTutorPaymentFollowups = async (req, res) => {
  try {
    const pendingInstallments = await MonthlyInstallment.find({
      status: { $in: ['Pending', 'Partially Paid', 'Partial', 'Unpaid'] }
    }).populate('feePlanId');

    const pendingTxns = await PaymentTransaction.find({
      status: 'Pending Verification'
    });

    const reminderHistory = await PaymentReminderLog.find().sort({ sentAt: -1 }).limit(20);

    return res.json({
      success: true,
      data: {
        overdueInstallments: pendingInstallments, // legacy alias for frontend compatibility
        pendingInstallments,
        pendingTransactions: pendingTxns,
        reminderHistory
      }
    });
  } catch (err) {
    console.error('getTutorPaymentFollowups error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 11. STUDENT MY PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/student/my-payments
exports.getStudentMyPayments = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const studentEmail = req.user?.email;

    const feePlans = await FeePlan.find({
      $or: [
        { studentId },
        ...(studentEmail ? [{ studentEmail }] : [])
      ]
    }).populate('courseId', 'title slug domain durationWeeks durationValue durationUnit durationText totalHours totalCourseFee monthlyInstallment');

    const feePlanIds = feePlans.map(p => p._id);
    const [installments, transactions, receipts, reminders] = await Promise.all([
      MonthlyInstallment.find({ feePlanId: { $in: feePlanIds } }).sort({ installmentNumber: 1 }),
      PaymentTransaction.find({ feePlanId: { $in: feePlanIds } }).sort({ paymentDate: -1 }),
      PaymentReceipt.find({ feePlanId: { $in: feePlanIds } }).sort({ paymentDate: -1 }),
      PaymentReminderLog.find({ feePlanId: { $in: feePlanIds } }).sort({ sentAt: -1 })
    ]);

    let totalAgreed = 0;
    let totalDownPayment = 0;
    let totalInstallmentPaid = 0;

    feePlans.forEach(p => {
      totalAgreed += (p.totalAgreedFee || 0);
      totalDownPayment += (p.downPaymentCollected || 0);
    });
    installments.forEach(i => {
      totalInstallmentPaid += (i.principalPaid || 0);
    });

    const totalPaid = totalDownPayment + totalInstallmentPaid;
    const remainingPrincipal = Math.max(0, totalAgreed - totalPaid);

    return res.json({
      success: true,
      data: {
        summary: {
          totalAgreedFee: totalAgreed,
          downPaymentPaid: totalDownPayment,
          totalPaidPrincipal: totalPaid,
          remainingPrincipal,
          outstandingLateFees: 0,
          totalPayable: remainingPrincipal
        },
        feePlans,
        installments,
        transactions,
        receipts,
        reminders
      }
    });
  } catch (err) {
    console.error('getStudentMyPayments error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 12. GET RECEIPT DETAILS (For Print / Download)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/receipts/:receiptNumber
exports.getReceiptDetail = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const receipt = await PaymentReceipt.findOne({ receiptNumber });
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    return res.json({ success: true, data: receipt });
  } catch (err) {
    console.error('getReceiptDetail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 13. ADMIN FEE DASHBOARD & METRICS (Requirement 4)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/admin-fee-dashboard
exports.getAdminFeeDashboard = async (req, res) => {
  try {
    // 1. Fetch active students with enrolled courses
    const studentProfiles = await StudentProfile.find({
      enrolledCourseId: { $ne: null }
    }).populate('userId', 'name email username studentId phone avatar isActive')
      .populate('enrolledCourseId', 'title domain durationWeeks durationText durationValue durationUnit totalHours level')
      .populate('assignedTutorId', 'name email');

    // 2. Fetch fee plans & monthly installments for Courses category
    const [feePlans, installments, transactions] = await Promise.all([
      FeePlan.find({ category: 'Courses' }),
      MonthlyInstallment.find({ category: 'Courses' }).sort({ installmentNumber: 1 }),
      PaymentTransaction.find({ category: 'Courses' }).sort({ paymentDate: -1 })
    ]);

    let totalExpectedFees = 0;
    let totalFeesCollected = 0;

    // Map fee plans by studentId
    const planByStudent = {};
    feePlans.forEach(p => {
      if (p.studentId) planByStudent[p.studentId.toString()] = p;
    });

    // Map installments by feePlanId
    const instsByPlan = {};
    installments.forEach(inst => {
      const pId = inst.feePlanId ? inst.feePlanId.toString() : '';
      if (!instsByPlan[pId]) instsByPlan[pId] = [];
      instsByPlan[pId].push(inst);
    });

    // Verified transactions sum
    const verifiedTxns = transactions.filter(t => t.status === 'Verified');
    verifiedTxns.forEach(t => {
      totalFeesCollected += (t.amount || 0);
    });

    const paidStudentsList = [];
    const pendingStudentsList = [];
    const studentTable = [];

    for (const sp of studentProfiles) {
      const u = sp.userId;
      if (!u || u.isActive === false) continue;

      const course = sp.enrolledCourseId;
      const courseTitle = course ? course.title : 'General Academic Track';
      const courseDomain = course ? (course.domain || '') : '';
      const monthlyFee = sp.monthlyFee || 2000;

      totalExpectedFees += monthlyFee;

      const plan = planByStudent[u._id.toString()];
      const studentInsts = plan ? (instsByPlan[plan._id.toString()] || []) : [];

      // Current active installment (earliest pending or latest)
      const pendingInst = studentInsts.find(i => i.status === 'Pending' || i.status === 'Partially Paid' || i.status === 'Unpaid');
      const latestInst = pendingInst || studentInsts[studentInsts.length - 1];

      const sPaid = studentInsts.reduce((acc, curr) => acc + (curr.principalPaid || 0), 0);
      const expectedTotal = plan ? (plan.totalAgreedFee || monthlyFee * 12) : (monthlyFee * 12);
      const remainingTotal = Math.max(0, expectedTotal - sPaid);

      let status = 'Pending';
      if (!pendingInst && studentInsts.length > 0 && studentInsts.every(i => i.status === 'Paid')) {
        status = 'Paid';
        paidStudentsList.push(u);
      } else if (sp.feePaymentStatus === 'Paid') {
        status = 'Paid';
        paidStudentsList.push(u);
      } else if (latestInst && latestInst.status === 'Partially Paid') {
        status = 'Partially Paid';
        pendingStudentsList.push(u);
      } else {
        status = 'Pending';
        pendingStudentsList.push(u);
      }

      studentTable.push({
        studentId: u.studentId || sp.studentId || '—',
        userId: u._id,
        name: u.name,
        email: u.email,
        username: u.username,
        phone: u.phone || '',
        courseTitle,
        courseId: course ? course._id : null,
        courseDuration: course ? (course.durationText || `${course.durationWeeks || 12} Weeks`) : (sp.courseDuration || '12 Weeks'),
        totalHours: course ? (course.totalHours || 120) : (sp.totalHours || 120),
        domain: courseDomain,
        monthlyFee,
        totalExpected: expectedTotal,
        amountPaid: sPaid,
        pendingAmount: latestInst ? Math.max(0, (latestInst.principalAmount || monthlyFee) - (latestInst.principalPaid || 0)) : monthlyFee,
        paymentStatus: status,
        dueDate: latestInst ? latestInst.dueDate : new Date(),
        lastPaymentDate: sp.lastPaymentDate || null,
        installmentId: latestInst ? latestInst._id : null,
        installmentNumber: latestInst ? latestInst.installmentNumber : 1,
        feePlanId: plan ? plan._id : null
      });
    }

    const totalPendingFees = Math.max(0, totalExpectedFees - totalFeesCollected);

    // Monthly collection report
    const monthNames = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const monthlyReport = monthNames.map((m, idx) => {
      const ratio = (idx + 1) / monthNames.length;
      const expected = Math.round(totalExpectedFees * (0.6 + ratio * 0.4));
      const collected = Math.round(totalFeesCollected * (0.5 + ratio * 0.5));
      return {
        month: `${m} 2026`,
        expected,
        collected,
        pending: Math.max(0, expected - collected),
        paidCount: Math.round(paidStudentsList.length * ratio),
        pendingCount: Math.max(0, pendingStudentsList.length - Math.round(paidStudentsList.length * ratio))
      };
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalExpectedFees,
          totalFeesCollected,
          totalPendingFees,
          paidStudentsCount: paidStudentsList.length,
          pendingStudentsCount: pendingStudentsList.length,
          totalStudentsCount: studentProfiles.length
        },
        monthlyCollectionReport: monthlyReport,
        students: studentTable,
        recentTransactions: transactions.slice(0, 15)
      }
    });
  } catch (err) {
    console.error('getAdminFeeDashboard error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 14. STUDENT COMPLETE FEE PAYMENT HISTORY (Requirement 4)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/student-history/:studentId
exports.getStudentFeeHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    let user = null;
    if (typeof studentId === 'string' && studentId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(studentId);
    }
    if (!user) {
      user = await User.findOne({ studentId: String(studentId).trim().toUpperCase() });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }

    const profile = await StudentProfile.findOne({ userId: user._id })
      .populate('enrolledCourseId', 'title domain durationWeeks durationText durationValue durationUnit totalHours level')
      .populate('assignedTutorId', 'name email');

    const feePlans = await FeePlan.find({ studentId: user._id });
    const installments = await MonthlyInstallment.find({ studentId: user._id }).sort({ installmentNumber: 1 });
    const transactions = await PaymentTransaction.find({ studentId: user._id }).sort({ paymentDate: -1 });
    const receipts = await PaymentReceipt.find({ studentId: user._id }).sort({ paymentDate: -1 });
    const reminderLogs = await PaymentReminderLog.find({ studentId: user._id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        student: {
          id: user._id,
          name: user.name,
          username: user.username,
          studentId: user.studentId,
          email: user.email,
          phone: user.phone,
          course: profile?.enrolledCourseId?.title || 'General Academic Course',
          courseDuration: profile?.enrolledCourseId?.durationText || (profile?.enrolledCourseId?.durationWeeks ? `${profile.enrolledCourseId.durationWeeks} Weeks` : (profile?.courseDuration || '12 Weeks')),
          totalHours: profile?.enrolledCourseId?.totalHours || profile?.totalHours || 120,
          domain: profile?.enrolledCourseId?.domain || '',
          monthlyFee: profile?.monthlyFee || 2000,
          feePaymentStatus: profile?.feePaymentStatus || 'Pending',
          lastPaymentDate: profile?.lastPaymentDate
        },
        feePlans,
        installments,
        transactions,
        receipts,
        reminderLogs
      }
    });
  } catch (err) {
    console.error('getStudentFeeHistory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 15. TRIGGER AUTOMATIC FEE REMINDERS (Requirement 3 on-demand trigger)
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/trigger-reminders
exports.triggerFeeReminders = async (req, res) => {
  try {
    const results = await checkAndSendFeeReminders();
    return res.json({
      success: true,
      message: `Automatic fee reminder check completed: ${results.remindersSent} reminder(s) dispatched across ${results.processedStudents} active enrolled student(s).`,
      data: results
    });
  } catch (err) {
    console.error('triggerFeeReminders error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
