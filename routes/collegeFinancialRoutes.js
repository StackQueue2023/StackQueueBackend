const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/collegeFinancialController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Admin financial management routes
router.get('/batches', protect, authorize('admin', 'superadmin'), ctrl.getFinancialBatches);
router.get('/batches/:id', protect, authorize('admin', 'superadmin'), ctrl.getBatchFinancialDetails);
router.post('/batches/:id/config', protect, authorize('admin', 'superadmin'), ctrl.updateFinancialConfig);
router.post('/batches/:id/trainers', protect, authorize('admin', 'superadmin'), ctrl.updateAssignedTrainers);
router.post('/batches/:id/college-payment', protect, authorize('admin', 'superadmin'), ctrl.recordCollegePayment);
router.post('/batches/:id/trainer-payment', protect, authorize('admin', 'superadmin'), ctrl.recordTrainerPayment);
router.post('/batches/:id/expenses', protect, authorize('admin', 'superadmin'), ctrl.addBatchExpense);
router.post('/batches/:id/generate-report', protect, authorize('admin', 'superadmin'), ctrl.generateManualReport);
router.get('/batches/:id/reports', protect, authorize('admin', 'superadmin'), ctrl.getBatchReports);
router.post('/reports/:reportId/resend', protect, authorize('admin', 'superadmin'), ctrl.resendReport);

// Configuration & Summary
router.get('/email-config', protect, authorize('admin', 'superadmin'), ctrl.getEmailConfig);
router.put('/email-config', protect, authorize('admin', 'superadmin'), ctrl.updateEmailConfig);
router.get('/college-summary/:collegeId', protect, authorize('admin', 'superadmin'), ctrl.getCollegeSummary);

module.exports = router;
