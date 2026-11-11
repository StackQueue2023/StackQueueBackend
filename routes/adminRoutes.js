const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', adminController.getAdminStats);
router.get('/command-center', adminController.getCommandCenterData);
router.get('/users', adminController.getUsers);
router.get('/challenges', adminController.getChallenges);
router.post('/challenges', adminController.createChallenge);
router.delete('/challenges/:id', adminController.deleteChallenge);
router.post('/batches', adminController.createBatch);
router.get('/colleges', adminController.getColleges);
router.post('/colleges', adminController.createCollege);
router.put('/colleges/:id', adminController.updateCollege);
router.delete('/colleges/:id', adminController.deleteCollege);
router.post('/badges', adminController.createBadge);
router.get('/live-monitor', adminController.getLiveMonitor);
router.get('/live-class/students', adminController.getLiveClassEligibleStudents);
router.post('/live-class/assign', adminController.assignLiveClassMeeting);
router.delete('/live-class/:id', adminController.deleteLiveClassMeeting);
router.post('/assign-tutor', adminController.assignTutorToStudent);
router.get('/session-reports', adminController.getSessionReports);

// Error Monitoring & Real-Time Alert Diagnostics Routes
const errorMonitoringController = require('../controllers/errorMonitoringController');
router.get('/error-logs', errorMonitoringController.getErrorLogs);
router.get('/error-logs/:id', errorMonitoringController.getErrorLogById);
router.patch('/error-logs/:id/resolve', errorMonitoringController.resolveErrorLog);
router.post('/error-logs/test-alert', errorMonitoringController.triggerTestAlert);
router.post('/error-logs/test-frontend-alert', errorMonitoringController.triggerTestFrontendAlert);
router.post('/error-logs/frontend-report', errorMonitoringController.reportFrontendError);
router.post('/error-logs/simulate-500', errorMonitoringController.triggerSimulated500);

module.exports = router;
