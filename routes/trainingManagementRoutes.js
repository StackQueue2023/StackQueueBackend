const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/trainingManagementController');

// Student endpoints (temporary training dashboard & task completion)
router.get('/my-dashboard', protect, authorize('student'), ctrl.getMyTrainingDashboard);
router.post('/tasks/:taskId/complete', protect, authorize('student', 'admin', 'trainer', 'tutor'), ctrl.completeTrainingTask);

// Admin & Trainer/Tutor endpoints
router.get('/overall-performance', protect, authorize('admin', 'trainer', 'tutor'), ctrl.getOverallPerformance);
router.get('/students', protect, authorize('admin', 'trainer', 'tutor'), ctrl.listTemporaryStudents);
router.get('/students/:studentId/dashboard', protect, authorize('admin', 'trainer', 'tutor'), ctrl.getStudentTrainingDashboardById);
router.get('/students/:studentId/report', protect, authorize('admin', 'trainer', 'tutor'), ctrl.getStudentPerformanceReport);
router.post('/assign-tasks', protect, authorize('admin', 'trainer', 'tutor'), ctrl.assignTrainingTasks);
router.post('/attendance/mark', protect, authorize('admin', 'trainer', 'tutor'), ctrl.markTrainingAttendance);
router.post('/batches/:batchId/send-daily-report', protect, authorize('admin', 'trainer', 'tutor'), ctrl.triggerDailyReportEmail);
router.post('/batches/:batchId/send-weekly-report', protect, authorize('admin', 'trainer', 'tutor'), ctrl.triggerWeeklyReportEmail);
router.get('/batches/:batchId/weekly-pdf', protect, authorize('admin', 'trainer', 'tutor'), ctrl.downloadWeeklyReportPdf);
router.get('/notification-history', protect, authorize('admin', 'trainer', 'tutor'), ctrl.getNotificationHistory);

module.exports = router;
