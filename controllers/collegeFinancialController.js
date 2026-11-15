const Batch = require('../models/Batch');
const College = require('../models/College');
const Course = require('../models/Course');
const User = require('../models/User');
const {
  CollegePaymentTransaction,
  TrainerPaymentTransaction,
  CollegeFinancialConfig,
  CollegeFinancialReport,
  CollegeFinancialEmailLog
} = require('../models/CollegeFinancialModels');
const { triggerFinancialReport, resendReportEmail } = require('../services/collegeFinancialReportService');

/**
 * Core recalculation engine for Batch Financials
 */
async function recalculateBatchFinancials(batchId) {
  const batch = await Batch.findById(batchId);
  if (!batch) return null;

  // 1. Enrolled student count
  const studentCount = batch.studentIds ? batch.studentIds.length : (batch.totalStudents || 0);
  batch.totalStudents = studentCount;

  // 2. Scheduled training days (valid scheduled days, excluding holidays / cancelled)
  let validDays = 0;
  if (batch.scheduledDays && batch.scheduledDays.length > 0) {
    validDays = batch.scheduledDays.filter(d => !d.isHoliday && d.status !== 'Cancelled').length;
  }
  if (validDays > 0) {
    batch.actualTrainingDays = validDays;
  } else if (!batch.actualTrainingDays || batch.actualTrainingDays === 0) {
    batch.actualTrainingDays = 10; // Default fallback if not yet scheduled
  }

  // 3. College Revenue Calculation (Option A vs Option B strictly separate!)
  if (batch.pricingModel === 'PER_DAY') {
    // Option B: Actual Scheduled Training Days × Per Day Amount. (Never multiply student count!)
    const perDayRate = batch.ratePerDay ?? 5000;
    batch.expectedCollegeRevenue = (batch.actualTrainingDays || 0) * perDayRate;
  } else {
    // Option A: Actual Student Count × Per Student Amount. (Never multiply training days!)
    const perStudentRate = batch.ratePerStudent ?? 2000;
    batch.expectedCollegeRevenue = studentCount * perStudentRate;
  }

  // 4. College Verified Payments Received
  const collegePayments = await CollegePaymentTransaction.find({
    batchId: batch._id,
    status: 'Verified'
  });
  const totalCollegeReceived = collegePayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  batch.totalCollegeReceived = totalCollegeReceived;

  // 5. College Pending
  batch.collegePendingAmount = Math.max(0, batch.expectedCollegeRevenue - totalCollegeReceived);

  // Status
  if (totalCollegeReceived >= batch.expectedCollegeRevenue && batch.expectedCollegeRevenue > 0) {
    batch.collegePaymentStatus = 'Fully Received';
  } else if (totalCollegeReceived > 0) {
    batch.collegePaymentStatus = 'Partially Received';
  } else {
    batch.collegePaymentStatus = 'Not Received';
  }

  // 6. Trainer Obligations & Releases
  const trainerPayments = await TrainerPaymentTransaction.find({
    batchId: batch._id,
    status: 'Verified'
  });

  let totalTrainerPayment = 0;
  let totalTrainerReleased = 0;

  if (batch.assignedTrainers && batch.assignedTrainers.length > 0) {
    for (let trainer of batch.assignedTrainers) {
      const tIdStr = (trainer.trainerId?._id || trainer.trainerId || '').toString();
      
      // Calculate total trainer payment based on model
      if (trainer.paymentModel === 'FIXED') {
        trainer.totalPayment = trainer.rate || 0;
      } else {
        // PER_DAY
        const days = trainer.assignedDays || batch.actualTrainingDays || 1;
        trainer.totalPayment = days * (trainer.rate || 0);
      }

      // Sum verified releases for this trainer
      const releases = trainerPayments.filter(p => p.trainerId?.toString() === tIdStr);
      trainer.amountReleased = releases.reduce((acc, p) => acc + (p.amount || 0), 0);
      trainer.pendingAmount = Math.max(0, trainer.totalPayment - trainer.amountReleased);

      if (trainer.amountReleased >= trainer.totalPayment && trainer.totalPayment > 0) {
        trainer.paymentStatus = 'Fully Paid';
      } else if (trainer.amountReleased > 0) {
        trainer.paymentStatus = 'Partially Released';
      } else {
        trainer.paymentStatus = 'Not Released';
      }

      totalTrainerPayment += trainer.totalPayment;
      totalTrainerReleased += trainer.amountReleased;
    }
  }

  batch.totalTrainerPayment = totalTrainerPayment;
  batch.totalTrainerReleased = totalTrainerReleased;
  batch.trainerPaymentPending = Math.max(0, totalTrainerPayment - totalTrainerReleased);

  if (totalTrainerReleased >= totalTrainerPayment && totalTrainerPayment > 0) {
    batch.trainerPaymentStatus = 'Fully Paid';
  } else if (totalTrainerReleased > 0) {
    batch.trainerPaymentStatus = 'Partially Released';
  } else {
    batch.trainerPaymentStatus = 'Not Released';
  }

  // 7. Other Expenses
  const totalExpenses = (batch.expenses || [])
    .filter(e => e.paymentStatus === 'Paid')
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  batch.totalExpenses = totalExpenses;

  // 8. Expected Training Profit: Expected College Revenue - Total Trainer Payment - Total Other Expenses
  batch.estimatedProfit = batch.expectedCollegeRevenue - totalTrainerPayment - totalExpenses;

  // 9. Actual Cash Balance: Verified College Payments Received - Verified Trainer Payments Released - Other Verified Expenses Paid
  batch.actualCashBalance = totalCollegeReceived - totalTrainerReleased - totalExpenses;

  await batch.save();
  return batch;
}

/**
 * GET /api/college-financial/batches
 * Fetches batches with all required financial columns, filtered by tab status
 */
exports.getFinancialBatches = async (req, res) => {
  try {
    const { status, collegeId, department, courseId, search } = req.query;

    // Base query: College Training Batches only
    let baseQuery = { batchType: 'COLLEGE_TRAINING' };

    if (collegeId && collegeId !== 'ALL') {
      baseQuery.collegeId = collegeId;
    }
    if (department && department !== 'ALL') {
      baseQuery.department = department;
    }
    if (courseId && courseId !== 'ALL') {
      baseQuery.courseId = courseId;
    }

    // Ensure all batches have up-to-date calculations
    const allCollegeBatches = await Batch.find(baseQuery)
      .populate('collegeId')
      .populate('courseId')
      .populate('assignedTrainers.trainerId')
      .sort({ createdAt: -1 });

    // Recalculate any batch that has pending calculation or default values
    for (let b of allCollegeBatches) {
      if (b.expectedCollegeRevenue === 0 && (b.studentIds?.length > 0 || b.actualTrainingDays > 0)) {
        await recalculateBatchFinancials(b._id);
      }
    }

    // Refresh after recalculation
    const refreshedBatches = await Batch.find(baseQuery)
      .populate('collegeId')
      .populate('courseId')
      .populate('assignedTrainers.trainerId')
      .sort({ createdAt: -1 });

    // Calculate Global Counts for Navigation Tabs
    const allCount = refreshedBatches.length;
    const upcomingCount = refreshedBatches.filter(b => b.status === 'upcoming').length;
    const activeCount = refreshedBatches.filter(b => b.status === 'active').length;
    const completedCount = refreshedBatches.filter(b => b.status === 'completed').length;
    const collegePendingCount = refreshedBatches.filter(b => (b.collegePendingAmount || 0) > 0).length;
    const trainerPendingCount = refreshedBatches.filter(b => (b.trainerPaymentPending || 0) > 0).length;
    const totalPendingCount = refreshedBatches.filter(b => (b.collegePendingAmount || 0) > 0 || (b.trainerPaymentPending || 0) > 0).length;

    // Apply Tab Filtering
    let filtered = refreshedBatches;
    if (status === 'upcoming') {
      filtered = filtered.filter(b => b.status === 'upcoming');
    } else if (status === 'active') {
      filtered = filtered.filter(b => b.status === 'active');
    } else if (status === 'completed') {
      filtered = filtered.filter(b => b.status === 'completed');
    } else if (status === 'college-pending') {
      filtered = filtered.filter(b => (b.collegePendingAmount || 0) > 0);
    } else if (status === 'trainer-pending') {
      filtered = filtered.filter(b => (b.trainerPaymentPending || 0) > 0);
    } else if (status === 'pending') {
      filtered = filtered.filter(b => (b.collegePendingAmount || 0) > 0 || (b.trainerPaymentPending || 0) > 0);
    }

    // Apply Search Filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(b => {
        return (
          b.name?.toLowerCase().includes(q) ||
          b.code?.toLowerCase().includes(q) ||
          b.collegeId?.name?.toLowerCase().includes(q) ||
          b.collegeId?.city?.toLowerCase().includes(q) ||
          b.department?.toLowerCase().includes(q) ||
          b.courseId?.title?.toLowerCase().includes(q)
        );
      });
    }

    res.json({
      success: true,
      counts: {
        allCount,
        upcomingCount,
        activeCount,
        completedCount,
        collegePendingCount,
        trainerPendingCount,
        totalPendingCount
      },
      batches: filtered
    });
  } catch (err) {
    console.error('[getFinancialBatches] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/college-financial/batches/:id
 */
exports.getBatchFinancialDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let batch = await recalculateBatchFinancials(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    batch = await Batch.findById(id)
      .populate('collegeId')
      .populate('courseId')
      .populate('studentIds', 'name email username studentId rollNo department academicYear')
      .populate('assignedTrainers.trainerId', 'name email phone domain')
      .lean();

    const collegePayments = await CollegePaymentTransaction.find({ batchId: id }).sort({ paymentDate: -1 }).lean();
    const trainerPayments = await TrainerPaymentTransaction.find({ batchId: id }).sort({ paymentDate: -1 }).lean();
    const reports = await CollegeFinancialReport.find({ batchId: id }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      batch,
      collegePayments,
      trainerPayments,
      reports
    });
  } catch (err) {
    console.error('[getBatchFinancialDetails] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/batches/:id/config
 * Configure pricing model (Option A: PER_STUDENT vs Option B: PER_DAY)
 */
exports.updateFinancialConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { pricingModel, ratePerStudent, ratePerDay, actualTrainingDays, collegePaymentDueDate } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (pricingModel) batch.pricingModel = pricingModel;
    if (ratePerStudent !== undefined) batch.ratePerStudent = Number(ratePerStudent);
    if (ratePerDay !== undefined) batch.ratePerDay = Number(ratePerDay);
    if (actualTrainingDays !== undefined) batch.actualTrainingDays = Number(actualTrainingDays);
    if (collegePaymentDueDate) batch.collegePaymentDueDate = new Date(collegePaymentDueDate);

    await batch.save();
    const updated = await recalculateBatchFinancials(id);

    res.json({
      success: true,
      message: 'Financial configuration updated successfully',
      batch: updated
    });
  } catch (err) {
    console.error('[updateFinancialConfig] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/batches/:id/trainers
 * Manage multiple trainers and their individual rates/days
 */
exports.updateAssignedTrainers = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainers } = req.body; // Array of { trainerId, name, email, phone, domain, paymentModel, rate, assignedDays }

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (Array.isArray(trainers)) {
      batch.assignedTrainers = trainers.map(t => ({
        trainerId: t.trainerId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        domain: t.domain,
        paymentModel: t.paymentModel || 'PER_DAY',
        rate: Number(t.rate) || 0,
        assignedDays: Number(t.assignedDays) || (batch.actualTrainingDays || 10),
        amountReleased: Number(t.amountReleased) || 0,
        totalPayment: 0,
        pendingAmount: 0
      }));
    }

    await batch.save();
    const updated = await recalculateBatchFinancials(id);

    res.json({
      success: true,
      message: 'Trainers assigned & obligations calculated successfully',
      batch: updated
    });
  } catch (err) {
    console.error('[updateAssignedTrainers] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/batches/:id/college-payment
 * Record verified incoming college payment
 * Triggers Automatic Event A: generates PDF report & emails it!
 */
exports.recordCollegePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, invoiceNumber, paymentDate, paymentMode, transactionReference, bankUpiReference, remarks } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const transactionId = `TXN-COL-${Date.now().toString().slice(-6)}`;
    const payment = new CollegePaymentTransaction({
      transactionId,
      batchId: batch._id,
      collegeId: batch.collegeId,
      invoiceNumber: invoiceNumber || `INV-${batch.code}-${Date.now().toString().slice(-4)}`,
      amount: Number(amount) || 0,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode: paymentMode || 'Bank Transfer',
      transactionReference: transactionReference || '',
      bankUpiReference: bankUpiReference || '',
      remarks: remarks || '',
      status: 'Verified',
      recordedBy: req.user?._id
    });

    await payment.save();

    // Update batch last payment date
    batch.collegeLastPaymentDate = payment.paymentDate;
    await batch.save();

    // Recalculate batch
    const updatedBatch = await recalculateBatchFinancials(id);

    // Automatic Event A: Generate PDF and dispatch Email
    const reportRecord = await triggerFinancialReport(updatedBatch, 'COLLEGE_PAYMENT', transactionId);

    res.json({
      success: true,
      message: 'College payment recorded & verified successfully',
      payment,
      batch: updatedBatch,
      report: reportRecord
    });
  } catch (err) {
    console.error('[recordCollegePayment] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/batches/:id/trainer-payment
 * Record verified outgoing trainer payment release
 * Triggers Automatic Event B: generates PDF report & emails it!
 */
exports.recordTrainerPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId, trainerName, amount, paymentDate, paymentMode, transactionReference, bankUpiReference, remarks } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const transactionId = `TXN-TRN-${Date.now().toString().slice(-6)}`;
    const payment = new TrainerPaymentTransaction({
      transactionId,
      batchId: batch._id,
      trainerId,
      trainerName: trainerName || 'Trainer',
      amount: Number(amount) || 0,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode: paymentMode || 'Bank Transfer',
      transactionReference: transactionReference || '',
      bankUpiReference: bankUpiReference || '',
      remarks: remarks || '',
      status: 'Verified',
      recordedBy: req.user?._id
    });

    await payment.save();

    // Recalculate batch
    const updatedBatch = await recalculateBatchFinancials(id);

    // Automatic Event B: Generate PDF and dispatch Email
    const reportRecord = await triggerFinancialReport(updatedBatch, 'TRAINER_PAYMENT', transactionId);

    res.json({
      success: true,
      message: 'Trainer payment release recorded & verified successfully',
      payment,
      batch: updatedBatch,
      report: reportRecord
    });
  } catch (err) {
    console.error('[recordTrainerPayment] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/batches/:id/expenses
 */
exports.addBatchExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, date, description, receiptUrl } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const expenseItem = {
      expenseId: `EXP-${Date.now().toString().slice(-5)}`,
      category: category || 'Other',
      amount: Number(amount) || 0,
      date: date ? new Date(date) : new Date(),
      description: description || '',
      paymentStatus: 'Paid',
      receiptUrl: receiptUrl || ''
    };

    batch.expenses.push(expenseItem);
    await batch.save();

    const updatedBatch = await recalculateBatchFinancials(id);

    res.json({
      success: true,
      message: 'Expense added successfully',
      expense: expenseItem,
      batch: updatedBatch
    });
  } catch (err) {
    console.error('[addBatchExpense] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/batches/:id/generate-report
 * Manually trigger PDF generation and email
 */
exports.generateManualReport = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await recalculateBatchFinancials(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const reportRecord = await triggerFinancialReport(batch, 'MANUAL_GENERATION');

    res.json({
      success: true,
      message: 'Financial report generated and dispatched',
      report: reportRecord
    });
  } catch (err) {
    console.error('[generateManualReport] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/college-financial/batches/:id/reports
 */
exports.getBatchReports = async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await CollegeFinancialReport.find({ batchId: id }).sort({ createdAt: -1 });
    const logs = await CollegeFinancialEmailLog.find({ batchId: id }).sort({ sentAt: -1 });

    res.json({
      success: true,
      reports,
      logs
    });
  } catch (err) {
    console.error('[getBatchReports] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/college-financial/reports/:reportId/resend
 */
exports.resendReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { recipient } = req.body;

    const report = await resendReportEmail(reportId, recipient);

    res.json({
      success: true,
      message: 'Report email resent successfully',
      report
    });
  } catch (err) {
    console.error('[resendReport] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/college-financial/email-config
 */
exports.getEmailConfig = async (req, res) => {
  try {
    let config = await CollegeFinancialConfig.findOne();
    if (!config) {
      config = await CollegeFinancialConfig.create({
        primaryEmail: process.env.ADMIN_ALERT_EMAIL || 'stackqueue2023@gmail.com',
        ccEmails: [],
        autoEmailReports: true
      });
    }
    res.json({ success: true, config });
  } catch (err) {
    console.error('[getEmailConfig] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/college-financial/email-config
 */
exports.updateEmailConfig = async (req, res) => {
  try {
    const { primaryEmail, ccEmails, autoEmailReports } = req.body;
    let config = await CollegeFinancialConfig.findOne();
    if (!config) {
      config = new CollegeFinancialConfig();
    }
    if (primaryEmail) config.primaryEmail = primaryEmail;
    if (ccEmails !== undefined) config.ccEmails = ccEmails;
    if (autoEmailReports !== undefined) config.autoEmailReports = Boolean(autoEmailReports);

    await config.save();
    res.json({ success: true, message: 'Email configuration updated', config });
  } catch (err) {
    console.error('[updateEmailConfig] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/college-financial/college-summary/:collegeId
 * Aggregates all batches for a specific college (Section 19)
 */
exports.getCollegeSummary = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });

    const batches = await Batch.find({ collegeId, batchType: 'COLLEGE_TRAINING' })
      .populate('courseId')
      .sort({ createdAt: -1 });

    let totalStudents = 0;
    let totalTrainingDays = 0;
    let totalExpectedRevenue = 0;
    let totalCollegeReceived = 0;
    let totalCollegePending = 0;
    let totalTrainerPayment = 0;
    let totalTrainerReleased = 0;
    let totalTrainerPending = 0;
    let totalExpenses = 0;

    for (let b of batches) {
      totalStudents += (b.studentIds?.length || b.totalStudents || 0);
      totalTrainingDays += (b.actualTrainingDays || 0);
      totalExpectedRevenue += (b.expectedCollegeRevenue || 0);
      totalCollegeReceived += (b.totalCollegeReceived || 0);
      totalCollegePending += (b.collegePendingAmount || 0);
      totalTrainerPayment += (b.totalTrainerPayment || 0);
      totalTrainerReleased += (b.totalTrainerReleased || 0);
      totalTrainerPending += (b.trainerPaymentPending || 0);
      totalExpenses += (b.totalExpenses || 0);
    }

    const estimatedProfit = totalExpectedRevenue - totalTrainerPayment - totalExpenses;
    const actualCashBalance = totalCollegeReceived - totalTrainerReleased - totalExpenses;

    res.json({
      success: true,
      college,
      summary: {
        batchCount: batches.length,
        totalStudents,
        totalTrainingDays,
        totalExpectedRevenue,
        totalCollegeReceived,
        totalCollegePending,
        totalTrainerPayment,
        totalTrainerReleased,
        totalTrainerPending,
        totalExpenses,
        estimatedProfit,
        actualCashBalance
      },
      batches
    });
  } catch (err) {
    console.error('[getCollegeSummary] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
