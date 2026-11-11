const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// ── Admin Command Center: Category Operational Analytics ───────────────────
router.get(
  '/command-center-analytics',
  protect,
  authorize('admin'),
  paymentController.getCommandCenterAnalytics
);

// ── Admin Fee Management Dashboard ─────────────────────────────────────────
router.get(
  '/admin-fee-dashboard',
  protect,
  authorize('admin'),
  paymentController.getAdminFeeDashboard
);

// ── Student Complete Fee Payment History ───────────────────────────────────
router.get(
  '/student-history/:studentId',
  protect,
  authorize('admin', 'trainer', 'tutor'),
  paymentController.getStudentFeeHistory
);

// ── Trigger Automatic Fee Reminders (On-Demand Run) ────────────────────────
router.post(
  '/trigger-reminders',
  protect,
  authorize('admin'),
  paymentController.triggerFeeReminders
);

// ── Category Operational View ──────────────────────────────────────────────
router.get(
  '/category-analytics/:category',
  protect,
  authorize('admin'),
  paymentController.getCategoryAnalytics
);

// ── Category Dedicated Payments Section ────────────────────────────────────
router.get(
  '/category-payments/:category',
  protect,
  authorize('admin'),
  paymentController.getCategoryPayments
);

// ── Student Fee Plan & Installments Detail ─────────────────────────────────
router.get(
  '/student-payment-detail/:feePlanId',
  protect,
  authorize('admin', 'trainer', 'tutor'),
  paymentController.getStudentPaymentDetail
);

// ── Record & Verify Payments ───────────────────────────────────────────────
router.post(
  '/record-payment',
  protect,
  authorize('admin', 'trainer', 'tutor'),
  paymentController.recordPayment
);

router.post(
  '/verify-payment/:transactionId',
  protect,
  authorize('admin'),
  paymentController.verifyPayment
);

// ── Manual Reminder Dispatch (Mock Sink) ──────────────────────────────────
router.post(
  '/send-reminder/:installmentId',
  protect,
  authorize('admin'),
  paymentController.sendManualReminder
);

// ── Configure Student Fee Plan ─────────────────────────────────────────────
router.post(
  '/configure-plan',
  protect,
  authorize('admin'),
  paymentController.configureFeePlan
);

// ── Tutor Payment Follow-Up View ───────────────────────────────────────────
router.get(
  '/tutor/assigned-followups',
  protect,
  authorize('admin', 'trainer', 'tutor'),
  paymentController.getTutorPaymentFollowups
);

// ── Student My Payments Dashboard ──────────────────────────────────────────
router.get(
  '/student/my-payments',
  protect,
  paymentController.getStudentMyPayments
);

// ── Receipt Lookup & Download ──────────────────────────────────────────────
router.get(
  '/receipts/:receiptNumber',
  protect,
  paymentController.getReceiptDetail
);

module.exports = router;
