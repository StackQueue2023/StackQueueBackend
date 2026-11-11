const express = require('express');
const router = express.Router();
const studentController = require('../controllers/interviewQuestionController');
const adminController = require('../controllers/adminInterviewController');
const { protect, optionalProtect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// ─── Public / Practice Endpoints (Optional Auth) ───────────────────────────
router.get('/domains', optionalProtect, studentController.getAvailableDomains);
router.post('/select-domain', protect, studentController.selectStudentDomain);
router.get('/questions', optionalProtect, studentController.getQuestions);
router.get('/questions/:id', optionalProtect, studentController.getQuestionById);
router.get('/daily-challenge', optionalProtect, studentController.getDailyChallenge);
router.post('/daily-challenge/refresh', optionalProtect, studentController.refreshDailyChallenge);
router.post('/run', optionalProtect, studentController.runCode);

// Mock Interview endpoints (Allows guests to practice, saves under student if authenticated)
router.get('/mock-interview/start', optionalProtect, studentController.startMockInterview);
router.post('/mock-interview/start', optionalProtect, studentController.startMockInterview);
router.post('/mock-interview/submit', optionalProtect, studentController.submitMockInterview);

// ─── Authenticated Student Endpoints ────────────────────────────────────────
router.get('/progress', protect, studentController.getInterviewProgress);
router.get('/submissions', protect, studentController.getSubmissions);
router.post('/submit', protect, studentController.submitSolution);

// ─── Admin Routes ──────────────────────────────────────────────────────────
router.use('/admin', protect, authorize('admin'));

router.get('/admin/stats', adminController.getStats);
router.get('/admin/questions', adminController.getAllQuestions);
router.get('/admin/questions/:id', adminController.getQuestionById);
router.post('/admin/questions', adminController.createQuestion);
router.put('/admin/questions/:id', adminController.updateQuestion);
router.delete('/admin/questions/:id', adminController.deleteQuestion);

router.post('/admin/questions/:id/test-cases', adminController.addTestCase);
router.put('/admin/test-cases/:id', adminController.updateTestCase);
router.delete('/admin/test-cases/:id', adminController.deleteTestCase);

module.exports = router;
