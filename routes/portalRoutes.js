const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Public endpoints
router.get('/homepage-data', portalController.getHomepageData);
router.get('/courses', portalController.getCourses);
router.get('/internships', portalController.getInternships);
router.get('/products', portalController.getProducts);

// Admin endpoints
router.put('/statistics', protect, authorize('admin'), portalController.adminUpdateStatistics);

module.exports = router;
