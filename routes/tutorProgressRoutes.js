const express = require('express');
const router = express.Router();
const tutorProgressController = require('../controllers/tutorProgressController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/learning', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.getTutorLearning);
router.post('/learning', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.createTutorLearning);

router.get('/projects', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.getTutorProjects);
router.post('/projects', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.createTutorProject);
router.post('/projects/:projectId/progress', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.addProjectDailyProgress);

router.get('/interviews', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.getTutorInterviews);
router.post('/interviews/:interviewId/improvement', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.saveTutorImprovementUpdate);
router.post('/interviews', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.createTrainingInterview);
router.post('/interviews/:interviewId/failure-analysis', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.saveFailureAnalysis);
router.post('/interviews/:interviewId/corrective-action', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.saveCorrectiveAction);
router.post('/interviews/:interviewId/re-interview', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.scheduleReInterview);

router.get('/dashboard', protect, authorize('trainer', 'admin', 'tutor'), tutorProgressController.getTutorProgressDashboard);

module.exports = router;
