const express = require('express');
const router = express.Router();
const errorMonitoringController = require('../controllers/errorMonitoringController');

/**
 * @route   POST /api/monitoring/frontend-errors
 * @desc    Receive frontend UI loading/rendering failures & trigger admin email alerts
 * @access  Public (to capture unauthenticated login/public page crashes without 401 block)
 */
router.post('/frontend-errors', errorMonitoringController.reportFrontendError);

/**
 * @route   POST /api/monitoring/frontend-errors/test
 * @desc    Simulate and trigger test frontend failure alert
 * @access  Public / Testing
 */
router.post('/frontend-errors/test', errorMonitoringController.triggerTestFrontendAlert);

/**
 * @route   GET /api/monitoring/health
 * @desc    Health check endpoint for frontend monitor connection test
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'LMS UI Failure Monitoring Service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
