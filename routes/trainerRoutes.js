const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const collegeTrainingController = require('../controllers/collegeTrainingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('trainer', 'admin'));

router.get('/dashboard', trainerController.getTrainerDashboard);
router.get('/students', trainerController.getAssignedStudents);
router.post('/feedback', trainerController.addFeedback);

// Legacy Daily Report compatibility
router.post('/daily-report', trainerController.submitDailyReport);
router.get('/daily-reports', trainerController.getDailyReports);

// College Training Management & Day-Wise Report Flow APIs
router.get('/college-trainings', collegeTrainingController.getAssignedTrainings);
router.get('/college-trainings/:trainingId', collegeTrainingController.getTrainingDetails);
router.get('/college-trainings/:trainingId/day/:dayNumber', collegeTrainingController.getDayReport);
router.post('/college-trainings/:trainingId/day/:dayNumber/submit', collegeTrainingController.submitDayReport);

module.exports = router;
