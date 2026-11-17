const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const internshipController = require('../controllers/internshipController');

// Memory storage for PDF uploads (serverless compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Admin-only middleware
const adminOnly = [protect, authorize('admin')];
// Student-accessible middleware
const studentOnly = [protect];

// ==================== ADMIN ROUTES ====================
// Sheet Preview & Import
router.post('/preview-sheet', adminOnly, internshipController.previewSheet);
router.post('/import-batch', adminOnly, internshipController.confirmAndImportBatch);

// Batch Management
router.get('/batches', adminOnly, internshipController.getAllBatches);
router.get('/batches/:batchId', adminOnly, internshipController.getBatchById);
router.put('/batches/:batchId', adminOnly, internshipController.updateBatch);
router.get('/batches/:batchId/students', adminOnly, internshipController.getBatchStudents);
router.put('/students/:studentId', adminOnly, internshipController.updateStudent);
router.post('/batches/:batchId/sync', adminOnly, internshipController.syncGoogleSheet);

// Day-wise Syllabus PDF & Modules
router.post('/batches/:batchId/syllabus-pdf', adminOnly, upload.single('pdf'), internshipController.uploadDayWiseSyllabusPdf);
router.get('/batches/:batchId/modules', adminOnly, internshipController.getBatchModules);
router.put('/modules/:moduleId', adminOnly, internshipController.updateModule);

// Day-wise Questions
router.get('/batches/:batchId/days/:dayNumber/questions', adminOnly, internshipController.getDayQuestions);
router.post('/questions', adminOnly, internshipController.createQuestion);
router.put('/questions/:questionId', adminOnly, internshipController.updateQuestion);
router.delete('/questions/:questionId', adminOnly, internshipController.deleteQuestion);
router.post('/batches/:batchId/days/:dayNumber/regenerate-questions', adminOnly, internshipController.regenerateDayQuestions);

// Payment Analytics (Bar Charts)
router.get('/analytics/payments', adminOnly, internshipController.getPaymentAnalytics);

// ==================== STUDENT ROUTES ====================
router.get('/student/dashboard', studentOnly, internshipController.getStudentInternshipDashboard);
router.post('/student/questions/:questionId/submit', studentOnly, internshipController.submitStudentDayQuestion);
router.post('/student/days/:dayNumber/complete', studentOnly, internshipController.completeDayManually);

module.exports = router;
