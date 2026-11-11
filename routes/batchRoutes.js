const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const batchManagementController = require('../controllers/batchManagementController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Setup multer for PDF uploads
const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
const upload = multer({ dest: tempDir });

router.use(protect);

// Parse PDF / Text endpoint (admin)
router.post('/parse-pdf', authorize('admin'), upload.single('file'), batchManagementController.parseStudentPdf);

// Create Full Training Batch (admin)
router.post('/create-full', authorize('admin'), batchManagementController.createFullBatch);

// Create Batch with assigned students (admin)
router.post('/create', authorize('admin'), batchManagementController.createBatch);

// Update Batch (admin)
router.put('/:id', authorize('admin'), batchManagementController.updateBatch);

// Delete Batch (admin) - safe batch delete without deleting student user accounts
router.delete('/:id', authorize('admin'), batchManagementController.deleteBatch);

// Preview PDF student import for existing batch (admin)
router.post('/:id/preview-pdf', authorize('admin'), upload.single('file'), batchManagementController.previewPdfStudents);

// Append new/existing students into existing batch (admin)
router.post('/:id/append-students', authorize('admin'), batchManagementController.appendStudentsToBatch);

// Unassign student from batch (admin)
router.delete('/:id/students/:studentUserId', authorize('admin'), batchManagementController.removeStudentFromBatch);

// Schedule Batch Days (admin)
router.post('/schedule-days', authorize('admin'), batchManagementController.createBatchSchedules);

// Get eligible students for College Training batch selection
router.get('/eligible-students', authorize('admin', 'trainer', 'tutor'), batchManagementController.getCollegeTrainingEligibleStudents);

// List all batches (admin, trainer, tutor)
router.get('/', authorize('admin', 'trainer', 'tutor'), batchManagementController.getBatches);

// Get batch details with 8 tabs data (admin, trainer, tutor)
router.get('/:id/details', authorize('admin', 'trainer', 'tutor'), batchManagementController.getBatchDetails);

// Manually trigger PDF & email generation for a batch date (admin, trainer, tutor)
router.post('/:id/generate-report', authorize('admin', 'trainer', 'tutor'), batchManagementController.generateManualReport);

// Save Tutor Daily Update (trainer, tutor, admin)
router.post('/tutor-daily-update', authorize('trainer', 'tutor', 'admin'), batchManagementController.saveTutorDailyUpdate);

// Course Lifecycle & Reassignment Routes (admin, tutor, trainer)
router.get('/:id/lifecycle-students', authorize('admin', 'trainer', 'tutor'), batchManagementController.getBatchStudentsLifecycle);
router.post('/:id/assign-course', authorize('admin'), batchManagementController.assignCourseToBatchStudents);
router.post('/:id/complete-course', authorize('admin', 'trainer', 'tutor'), batchManagementController.markBatchCourseCompleted);
router.post('/:id/enrollments/:enrollmentId/complete', authorize('admin', 'trainer', 'tutor'), batchManagementController.markIndividualCourseCompleted);

module.exports = router;
