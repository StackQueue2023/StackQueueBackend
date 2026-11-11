const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('admin'));

// 1. Main Overview Dashboard
router.get('/overview', adminAnalyticsController.getMainOverviewAnalytics);

// 2. Course Analytics
router.get('/courses', adminAnalyticsController.getCourseAnalytics);

// 3. Internship Analytics
router.get('/internships', adminAnalyticsController.getInternshipAnalytics);

// 4. Products Analytics
router.get('/products', adminAnalyticsController.getProductAnalytics);

// 5. College Training Analytics
router.get('/college-training', adminAnalyticsController.getCollegeTrainingAnalytics);

// 6. College Projects Analytics
router.get('/college-projects', adminAnalyticsController.getCollegeProjectAnalytics);

module.exports = router;
