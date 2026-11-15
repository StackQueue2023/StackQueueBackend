const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const {
  CollegeFinancialConfig,
  CollegeFinancialReport,
  CollegeFinancialEmailLog
} = require('../models/CollegeFinancialModels');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../uploads/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Nodemailer transport
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'stackqueue2023@gmail.com',
      pass: process.env.SMTP_PASS || 'bpuqhqmnosekzhxt'
    }
  });
}

/**
 * Format currency in INR
 */
function formatINR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN');
}

/**
 * Format Date
 */
function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Generate PDF document for Batch Financial Report
 */
async function generateBatchFinancialPdf(batch, snapshot, version, reportId) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `Financial_Report_${batch.code || batch._id}_${version}.pdf`;
      const filePath = path.join(reportsDir, fileName);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // --- HEADER ---
      doc.rect(40, 40, 515, 65).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('STACK QUEUE', 55, 52);
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('INCLUSIVE LEARNING • FINANCIAL OPERATIONS & COHORTS', 55, 76);
      doc.fillColor('#38bdf8').fontSize(11).font('Helvetica-Bold').text('COLLEGE TRAINING FINANCIAL REPORT', 320, 52, { align: 'right' });
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica').text(`Version: ${version} • ID: ${reportId}`, 320, 72, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 320, 84, { align: 'right' });

      doc.moveDown(3);

      // --- 1. TRAINING DETAILS ---
      let y = 120;
      doc.rect(40, y, 515, 20).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('1. BATCH & TRAINING SPECIFICATIONS', 48, y + 5);
      
      y += 28;
      doc.fontSize(8.5).font('Helvetica');
      const collegeName = snapshot.collegeName || batch.collegeId?.name || 'N/A';
      const collegeCity = batch.collegeId?.city || 'N/A';
      const batchName = snapshot.batchName || batch.name;
      const batchCode = snapshot.batchCode || batch.code;
      const courseTitle = snapshot.courseTitle || batch.courseId?.title || 'N/A';
      const department = snapshot.department || batch.department || 'CSE';
      const studentCount = snapshot.studentCount ?? (batch.studentIds?.length || 0);
      const trainingDays = snapshot.actualTrainingDays ?? (batch.actualTrainingDays || 0);

      const col1X = 48, col2X = 220, col3X = 400;
      doc.fillColor('#475569').text(`College: `, col1X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(collegeName);
      doc.font('Helvetica').fillColor('#475569').text(`Batch: `, col2X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(`${batchName} (${batchCode})`);
      doc.font('Helvetica').fillColor('#475569').text(`Domain: `, col3X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(courseTitle);

      y += 16;
      doc.font('Helvetica').fillColor('#475569').text(`Location: `, col1X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(collegeCity);
      doc.font('Helvetica').fillColor('#475569').text(`Department: `, col2X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(department);
      doc.font('Helvetica').fillColor('#475569').text(`Total Students: `, col3X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(`${studentCount}`);

      y += 16;
      doc.font('Helvetica').fillColor('#475569').text(`Start Date: `, col1X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(formatDate(batch.startDate));
      doc.font('Helvetica').fillColor('#475569').text(`End Date: `, col2X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(formatDate(batch.endDate));
      doc.font('Helvetica').fillColor('#475569').text(`Training Days: `, col3X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(`${trainingDays} Days`);

      // --- 2. COLLEGE REVENUE DETAILS ---
      y += 28;
      doc.rect(40, y, 515, 20).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('2. INCOMING COLLEGE REVENUE & RECEIVABLES', 48, y + 5);

      y += 28;
      const pricingModel = snapshot.pricingModel === 'PER_DAY' ? 'Option B: Per Training Day' : 'Option A: Per Student / Head';
      const rateLabel = snapshot.pricingModel === 'PER_DAY' ? `${formatINR(snapshot.rate)} / day` : `${formatINR(snapshot.rate)} / student`;
      
      doc.fontSize(8.5).font('Helvetica');
      doc.fillColor('#475569').text(`Pricing Model: `, col1X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(pricingModel);
      doc.font('Helvetica').fillColor('#475569').text(`Agreed Rate: `, col2X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(rateLabel);
      doc.font('Helvetica').fillColor('#475569').text(`Payment Status: `, col3X, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(snapshot.collegePaymentStatus || 'Not Received');

      y += 16;
      doc.font('Helvetica').fillColor('#475569').text(`Expected Revenue: `, col1X, y, { continued: true }).font('Helvetica-Bold').fillColor('#1d4ed8').text(formatINR(snapshot.expectedCollegeRevenue));
      doc.font('Helvetica').fillColor('#475569').text(`Amount Received: `, col2X, y, { continued: true }).font('Helvetica-Bold').fillColor('#059669').text(formatINR(snapshot.totalCollegeReceived));
      doc.font('Helvetica').fillColor('#475569').text(`College Pending: `, col3X, y, { continued: true }).font('Helvetica-Bold').fillColor('#dc2626').text(formatINR(snapshot.collegePendingAmount));

      // Table of College Payments
      y += 20;
      doc.rect(40, y, 515, 16).fill('#e2e8f0');
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold');
      doc.text('DATE', 48, y + 4);
      doc.text('INVOICE / REF', 120, y + 4);
      doc.text('MODE', 240, y + 4);
      doc.text('BANK REF', 320, y + 4);
      doc.text('AMOUNT', 420, y + 4);
      doc.text('STATUS', 490, y + 4);

      y += 16;
      const collegePayments = snapshot.collegePayments || [];
      if (collegePayments.length === 0) {
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique').text('No incoming college payments recorded yet.', 48, y + 4);
        y += 16;
      } else {
        collegePayments.forEach(cp => {
          doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica');
          doc.text(formatDate(cp.paymentDate), 48, y + 4);
          doc.text(cp.invoiceNumber || cp.transactionReference || 'N/A', 120, y + 4);
          doc.text(cp.paymentMode || 'Bank Transfer', 240, y + 4);
          doc.text(cp.bankUpiReference || '-', 320, y + 4);
          doc.font('Helvetica-Bold').text(formatINR(cp.amount), 420, y + 4);
          doc.font('Helvetica').fillColor(cp.status === 'Verified' ? '#059669' : '#eab308').text(cp.status || 'Verified', 490, y + 4);
          y += 14;
        });
      }

      // --- 3. TRAINER PAYMENT DETAILS (NO 'Trainer Payment Approved' field!) ---
      y += 14;
      doc.rect(40, y, 515, 20).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('3. OUTGOING TRAINER REMUNERATION & DISBURSEMENTS', 48, y + 5);

      y += 24;
      doc.rect(40, y, 515, 16).fill('#e2e8f0');
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold');
      doc.text('TRAINER NAME', 48, y + 4);
      doc.text('MODEL / DAYS', 180, y + 4);
      doc.text('RATE', 260, y + 4);
      doc.text('TOTAL PAY', 330, y + 4);
      doc.text('RELEASED', 410, y + 4);
      doc.text('PENDING', 485, y + 4);

      y += 16;
      const trainers = snapshot.trainers || [];
      if (trainers.length === 0) {
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique').text('No trainers assigned yet.', 48, y + 4);
        y += 16;
      } else {
        trainers.forEach(t => {
          doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica');
          doc.text(t.name || 'Trainer', 48, y + 4);
          doc.text(`${t.paymentModel === 'FIXED' ? 'Fixed' : 'Per Day'} (${t.assignedDays || 0}d)`, 180, y + 4);
          doc.text(formatINR(t.rate), 260, y + 4);
          doc.font('Helvetica-Bold').text(formatINR(t.totalPayment), 330, y + 4);
          doc.fillColor('#059669').text(formatINR(t.amountReleased), 410, y + 4);
          doc.fillColor('#dc2626').text(formatINR(t.pendingAmount), 485, y + 4);
          y += 14;
        });
      }

      // --- 4. OTHER EXPENSES ---
      y += 12;
      doc.rect(40, y, 515, 20).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('4. OTHER OPERATIONAL EXPENSES', 48, y + 5);

      y += 24;
      const expenses = snapshot.expenses || [];
      doc.fontSize(8).font('Helvetica');
      if (expenses.length === 0) {
        doc.fillColor('#64748b').font('Helvetica-Oblique').text('No auxiliary expenses logged (Travel, Food, Stay, Materials: Rs. 0).', 48, y);
        y += 16;
      } else {
        expenses.forEach(ex => {
          doc.fillColor('#475569').text(`[${ex.category}] ${ex.description || 'Expense'}: `, 48, y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(formatINR(ex.amount));
          y += 13;
        });
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(`Total Other Expenses: ${formatINR(snapshot.totalExpenses)}`, 48, y);
        y += 16;
      }

      // --- 5. COMPREHENSIVE FINANCIAL SUMMARY ---
      y += 10;
      doc.rect(40, y, 515, 80).fill('#0f172a');
      doc.fillColor('#38bdf8').fontSize(10).font('Helvetica-Bold').text('5. FINAL FINANCIAL RECONCILIATION SUMMARY', 48, y + 8);

      const sumY = y + 26;
      doc.fontSize(8).font('Helvetica').fillColor('#cbd5e1');
      doc.text('Total Expected Revenue:', 48, sumY);
      doc.text('Total Verified Received:', 48, sumY + 14);
      doc.text('College Pending Amount:', 48, sumY + 28);

      doc.font('Helvetica-Bold').fillColor('#ffffff');
      doc.text(formatINR(snapshot.expectedCollegeRevenue), 160, sumY);
      doc.fillColor('#34d399').text(formatINR(snapshot.totalCollegeReceived), 160, sumY + 14);
      doc.fillColor('#f87171').text(formatINR(snapshot.collegePendingAmount), 160, sumY + 28);

      doc.fontSize(8).font('Helvetica').fillColor('#cbd5e1');
      doc.text('Total Trainer Obligation:', 240, sumY);
      doc.text('Total Trainer Released:', 240, sumY + 14);
      doc.text('Trainer Pending Amount:', 240, sumY + 28);

      doc.font('Helvetica-Bold').fillColor('#ffffff');
      doc.text(formatINR(snapshot.totalTrainerPayment), 350, sumY);
      doc.fillColor('#34d399').text(formatINR(snapshot.totalTrainerReleased), 350, sumY + 14);
      doc.fillColor('#f87171').text(formatINR(snapshot.trainerPaymentPending), 350, sumY + 28);

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#fbbf24');
      doc.text('Estimated Profit:', 420, sumY);
      doc.fontSize(10).text(formatINR(snapshot.estimatedProfit), 420, sumY + 12);
      doc.fontSize(8.5).fillColor('#38bdf8').text('Actual Cash Balance:', 420, sumY + 28);
      doc.fontSize(10).text(formatINR(snapshot.actualCashBalance), 420, sumY + 40);

      // Footer
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text('STACK QUEUE IT Services & Training Solutions • Confidential Automated Financial Record • Strictly Separated from LMS Course Ledgers', 40, 770, { align: 'center', width: 515 });

      doc.end();

      stream.on('finish', () => {
        resolve({ fileName, filePath });
      });
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Build snapshot and generate Report Version + Auto Email
 */
async function triggerFinancialReport(batch, triggerEvent, transactionId = '') {
  try {
    const Batch = require('../models/Batch');
    const College = require('../models/College');
    const Course = require('../models/Course');
    const { CollegePaymentTransaction, TrainerPaymentTransaction } = require('../models/CollegeFinancialModels');

    // Populate batch if needed
    const populatedBatch = await Batch.findById(batch._id)
      .populate('collegeId')
      .populate('courseId')
      .populate('assignedTrainers.trainerId')
      .lean();

    if (!populatedBatch) return null;

    // Fetch transactions
    const collegePayments = await CollegePaymentTransaction.find({ batchId: batch._id, status: 'Verified' }).sort({ paymentDate: 1 }).lean();
    const trainerPayments = await TrainerPaymentTransaction.find({ batchId: batch._id, status: 'Verified' }).sort({ paymentDate: 1 }).lean();

    // Determine Version
    const existingReportsCount = await CollegeFinancialReport.countDocuments({ batchId: batch._id });
    const versionMajor = 1;
    const versionMinor = existingReportsCount;
    const version = `v${versionMajor}.${versionMinor}`;
    const reportId = `SQ-REP-${batch.code || batch._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-5)}`;

    // Build Snapshot
    const studentCount = populatedBatch.studentIds?.length || populatedBatch.totalStudents || 0;
    const actualTrainingDays = populatedBatch.actualTrainingDays || (populatedBatch.scheduledDays?.filter(d => !d.isHoliday && d.status !== 'Cancelled').length || 0);
    const rate = populatedBatch.pricingModel === 'PER_DAY' ? (populatedBatch.ratePerDay || 5000) : (populatedBatch.ratePerStudent || 2000);

    const snapshot = {
      collegeName: populatedBatch.collegeId?.name || 'Partner College',
      batchName: populatedBatch.name,
      batchCode: populatedBatch.code,
      department: populatedBatch.department || 'CSE',
      courseTitle: populatedBatch.courseId?.title || 'Training Program',
      pricingModel: populatedBatch.pricingModel || 'PER_STUDENT',
      studentCount,
      actualTrainingDays,
      rate,
      expectedCollegeRevenue: populatedBatch.expectedCollegeRevenue || 0,
      totalCollegeReceived: populatedBatch.totalCollegeReceived || 0,
      collegePendingAmount: populatedBatch.collegePendingAmount || 0,
      totalTrainerPayment: populatedBatch.totalTrainerPayment || 0,
      totalTrainerReleased: populatedBatch.totalTrainerReleased || 0,
      trainerPaymentPending: populatedBatch.trainerPaymentPending || 0,
      totalExpenses: populatedBatch.totalExpenses || 0,
      estimatedProfit: populatedBatch.estimatedProfit || 0,
      actualCashBalance: populatedBatch.actualCashBalance || 0,
      collegePaymentStatus: populatedBatch.collegePaymentStatus || 'Not Received',
      trainerPaymentStatus: populatedBatch.trainerPaymentStatus || 'Not Released',
      trainers: (populatedBatch.assignedTrainers || []).map(t => ({
        trainerId: t.trainerId?._id || t.trainerId,
        name: t.name || t.trainerId?.name || 'Trainer',
        paymentModel: t.paymentModel,
        rate: t.rate,
        assignedDays: t.assignedDays,
        totalPayment: t.totalPayment,
        amountReleased: t.amountReleased,
        pendingAmount: t.pendingAmount,
        paymentStatus: t.paymentStatus
      })),
      expenses: populatedBatch.expenses || [],
      collegePayments: collegePayments.map(cp => ({
        paymentDate: cp.paymentDate,
        amount: cp.amount,
        paymentMode: cp.paymentMode,
        transactionReference: cp.transactionReference,
        invoiceNumber: cp.invoiceNumber,
        bankUpiReference: cp.bankUpiReference,
        status: cp.status
      })),
      trainerPayments: trainerPayments.map(tp => ({
        paymentDate: tp.paymentDate,
        trainerName: tp.trainerName,
        amount: tp.amount,
        paymentMode: tp.paymentMode,
        transactionReference: tp.transactionReference,
        bankUpiReference: tp.bankUpiReference,
        status: tp.status
      }))
    };

    // Generate PDF
    const { fileName, filePath } = await generateBatchFinancialPdf(populatedBatch, snapshot, version, reportId);
    const pdfUrl = `/uploads/reports/${fileName}`;

    // Create Report Record
    const reportRecord = new CollegeFinancialReport({
      reportId,
      batchId: batch._id,
      version,
      triggerEvent,
      transactionId,
      pdfPath: filePath,
      pdfUrl,
      summarySnapshot: snapshot,
      emailDeliveryStatus: 'Pending'
    });

    // Check Email Configuration
    let config = await CollegeFinancialConfig.findOne();
    if (!config) {
      config = await CollegeFinancialConfig.create({
        primaryEmail: process.env.ADMIN_ALERT_EMAIL || 'stackqueue2023@gmail.com',
        ccEmails: [],
        autoEmailReports: true
      });
    }

    if (!config.autoEmailReports) {
      reportRecord.emailDeliveryStatus = 'Disabled';
      await reportRecord.save();
      return reportRecord;
    }

    const recipient = config.primaryEmail || 'stackqueue2023@gmail.com';
    const cc = config.ccEmails || [];
    const collegeNameText = snapshot.collegeName;
    const batchNameText = snapshot.batchName;

    // Strict Subject Format from Prompt Section 15:
    // STACK QUEUE – College Training Financial Report – [College Name] – [Batch Name]
    const subject = `STACK QUEUE – College Training Financial Report – ${collegeNameText} – ${batchNameText}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; color: #ffffff;">
          <h2 style="margin: 0; color: #38bdf8;">STACK QUEUE</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">College Training Financial Report • ${version}</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p>Dear Administrator,</p>
          <p>A new verified financial event has been processed for the following college training batch:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>College:</strong></td><td>${collegeNameText}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Batch Name:</strong></td><td>${batchNameText} (${snapshot.batchCode})</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Training Course:</strong></td><td>${snapshot.courseTitle}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Payment Event:</strong></td><td><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${triggerEvent}</span></td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>College Pending:</strong></td><td style="color: #dc2626; font-weight: bold;">${formatINR(snapshot.collegePendingAmount)}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Trainer Pending:</strong></td><td style="color: #dc2626; font-weight: bold;">${formatINR(snapshot.trainerPaymentPending)}</td></tr>
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px; color: #0f172a;">Updated Financial Summary</h4>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <div>Expected Revenue: <strong>${formatINR(snapshot.expectedCollegeRevenue)}</strong></div>
              <div>Verified Received: <strong style="color: #059669;">${formatINR(snapshot.totalCollegeReceived)}</strong></div>
              <div>Trainer Released: <strong style="color: #0284c7;">${formatINR(snapshot.totalTrainerReleased)}</strong></div>
              <div>Actual Cash Balance: <strong>${formatINR(snapshot.actualCashBalance)}</strong></div>
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b;">The complete formal Batch Financial Report (${version}) is attached as a PDF document for your records.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Generated on: ${new Date().toLocaleString('en-GB')}<br/>Confidential Institutional Cohort Financial Communication • STACK QUEUE</p>
        </div>
      </div>
    `;

    // Attempt sending email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'STACK QUEUE'}" <${process.env.SMTP_FROM || 'stackqueue2023@gmail.com'}>`,
        to: recipient,
        cc: cc.length > 0 ? cc : undefined,
        subject,
        html: htmlBody,
        attachments: [{
          filename: fileName,
          path: filePath
        }]
      });

      reportRecord.emailDeliveryStatus = 'Sent';
      reportRecord.emailSentTo = recipient;
      reportRecord.emailSentAt = new Date();

      // Log success
      await CollegeFinancialEmailLog.create({
        reportId,
        batchId: batch._id,
        triggerEvent,
        recipient,
        cc,
        subject,
        status: 'Sent',
        sentAt: new Date()
      });
    } catch (mailErr) {
      console.error('[FinancialReportEmail] Error sending email:', mailErr.message);
      reportRecord.emailDeliveryStatus = 'Failed';
      reportRecord.emailError = mailErr.message;

      // Log failure
      await CollegeFinancialEmailLog.create({
        reportId,
        batchId: batch._id,
        triggerEvent,
        recipient,
        cc,
        subject,
        status: 'Failed',
        sentAt: new Date(),
        errorMessage: mailErr.message
      });
    }

    await reportRecord.save();
    return reportRecord;
  } catch (err) {
    console.error('[triggerFinancialReport] Exception:', err);
    return null;
  }
}

/**
 * Resend email for an existing report version
 */
async function resendReportEmail(reportId, customRecipient = null) {
  const { CollegeFinancialReport, CollegeFinancialConfig, CollegeFinancialEmailLog } = require('../models/CollegeFinancialModels');
  const report = await CollegeFinancialReport.findOne({ reportId }).populate('batchId');
  if (!report) throw new Error('Report version not found');

  const config = await CollegeFinancialConfig.findOne() || { primaryEmail: 'stackqueue2023@gmail.com', ccEmails: [] };
  const recipient = customRecipient || config.primaryEmail || 'stackqueue2023@gmail.com';
  const cc = config.ccEmails || [];

  const snapshot = report.summarySnapshot || {};
  const subject = `STACK QUEUE – College Training Financial Report – ${snapshot.collegeName || 'College'} – ${snapshot.batchName || 'Batch'} (Resent)`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'STACK QUEUE'}" <${process.env.SMTP_FROM || 'stackqueue2023@gmail.com'}>`,
    to: recipient,
    cc: cc.length > 0 ? cc : undefined,
    subject,
    html: `<p>Please find attached the requested copy of the financial report for <strong>${snapshot.batchName}</strong> (${report.version}).</p>`,
    attachments: [{
      filename: `Financial_Report_${snapshot.batchCode || 'Batch'}_${report.version}.pdf`,
      path: report.pdfPath
    }]
  });

  report.emailDeliveryStatus = 'Sent';
  report.emailSentTo = recipient;
  report.emailSentAt = new Date();
  report.emailError = '';
  await report.save();

  await CollegeFinancialEmailLog.create({
    reportId,
    batchId: report.batchId?._id || report.batchId,
    triggerEvent: 'MANUAL_RESEND',
    recipient,
    cc,
    subject,
    status: 'Sent',
    sentAt: new Date()
  });

  return report;
}

module.exports = {
  formatINR,
  formatDate,
  generateBatchFinancialPdf,
  triggerFinancialReport,
  resendReportEmail
};
