const ErrorLog = require('../models/ErrorLog');
const { captureError, captureFrontendError } = require('../services/errorAlertService');

/**
 * Get Paginated Error Logs with Filters & Aggregated Summary
 */
exports.getErrorLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { severity, service, isResolved, search } = req.query;

    const filter = {};

    if (severity && severity !== 'ALL') {
      filter.severity = severity.toUpperCase();
    }

    if (service && service !== 'ALL') {
      filter.service = { $regex: service, $options: 'i' };
    }

    if (isResolved !== undefined && isResolved !== '' && isResolved !== 'ALL') {
      filter.isResolved = isResolved === 'true';
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { errorId: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
        { endpoint: { $regex: q, $options: 'i' } },
        { service: { $regex: q, $options: 'i' } },
        { fileName: { $regex: q, $options: 'i' } }
      ];
    }

    // Query logs
    const [errorLogs, total] = await Promise.all([
      ErrorLog.find(filter)
        .sort({ lastOccurredAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ErrorLog.countDocuments(filter)
    ]);

    // Calculate overall telemetry summary
    const [totalErrors, criticalErrors, highErrors, pendingAlerts, resolvedErrors] = await Promise.all([
      ErrorLog.countDocuments(),
      ErrorLog.countDocuments({ severity: 'CRITICAL', isResolved: false }),
      ErrorLog.countDocuments({ severity: 'HIGH', isResolved: false }),
      ErrorLog.countDocuments({ alertStatus: { $in: ['PENDING', 'FAILED'] } }),
      ErrorLog.countDocuments({ isResolved: true })
    ]);

    res.json({
      success: true,
      data: {
        errorLogs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit
        },
        summary: {
          totalErrors,
          criticalErrors,
          highErrors,
          pendingAlerts,
          resolvedErrors
        }
      }
    });
  } catch (err) {
    console.error('[ErrorMonitoringController getErrorLogs Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve error logs' });
  }
};

/**
 * Get Specific Error Log by ID
 */
exports.getErrorLogById = async (req, res) => {
  try {
    const { id } = req.params;
    let log = null;

    if (id.startsWith('ERR-')) {
      log = await ErrorLog.findOne({ errorId: id }).lean();
    } else {
      log = await ErrorLog.findById(id).lean();
    }

    if (!log) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (err) {
    console.error('[ErrorMonitoringController getErrorLogById Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve error details' });
  }
};

/**
 * Mark Error Log as Resolved
 */
exports.resolveErrorLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const log = await ErrorLog.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { errorId: id }]
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }

    log.isResolved = true;
    log.resolvedAt = new Date();
    log.resolvedBy = req.user?._id;
    log.resolvedByName = req.user?.name || 'Administrator';
    if (resolutionNotes) {
      log.resolutionNotes = resolutionNotes;
    }

    await log.save();

    res.json({
      success: true,
      message: `Error ${log.errorId} marked as resolved`,
      data: log
    });
  } catch (err) {
    console.error('[ErrorMonitoringController resolveErrorLog Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to resolve error log' });
  }
};

/**
 * Trigger Real Test Error Alert Event
 */
exports.triggerTestAlert = async (req, res) => {
  try {
    const testError = new Error('Admin Diagnostics Verification: Real-Time backend error capture and instant alert test.');
    testError.name = 'DiagnosticsTestError';

    const alertResult = await captureError(testError, {
      req,
      service: 'Diagnostics Control Center',
      severity: 'CRITICAL',
      impact: 'Manual verification test initiated from Admin Error Monitoring dashboard'
    });

    res.json({
      success: true,
      message: 'Test error alert captured and dispatched to admin email.',
      errorId: alertResult?.errorId,
      alertStatus: alertResult?.alertStatus
    });
  } catch (err) {
    console.error('[ErrorMonitoringController triggerTestAlert Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to trigger test alert' });
  }
};

/**
 * Trigger Simulated 500 Error for Acceptance Testing
 */
exports.triggerSimulated500 = async (req, res, next) => {
  const simulatedError = new Error('Acceptance Test: Simulated 500 Internal Server Error in API endpoint.');
  simulatedError.status = 500;
  return next(simulatedError);
};

/**
 * Report Frontend UI Loading or Runtime Error & Trigger Alert
 */
exports.reportFrontendError = async (req, res) => {
  try {
    const payload = req.body || {};

    if (!payload.errorMessage && !payload.message && !payload.errorCategory) {
      return res.status(400).json({
        success: false,
        message: 'Invalid error payload: message or errorCategory is required'
      });
    }

    const result = await captureFrontendError(payload, { req });

    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process frontend error report'
      });
    }

    res.json({
      success: true,
      message: result.throttled
        ? 'Frontend error captured and throttled under cooldown policy.'
        : 'Frontend error captured and admin alerted.',
      correlationId: result.correlationId,
      errorId: result.errorId,
      throttled: result.throttled,
      occurrences: result.occurrences,
      pageName: result.pageName,
      moduleName: result.moduleName,
      occurredAtIST: result.occurredAtIST
    });
  } catch (err) {
    console.error('[ErrorMonitoringController reportFrontendError Exception]:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while logging frontend failure'
    });
  }
};

/**
 * Trigger Test Frontend UI Error Alert (for Admin Verification)
 */
exports.triggerTestFrontendAlert = async (req, res) => {
  try {
    const testPayload = {
      pageName: 'Course Analytics',
      route: '/admin/analytics/courses',
      moduleName: 'Course Analytics',
      errorCategory: 'React Render Error',
      errorMessage: 'Diagnostics Verification: Uncaught TypeError: Cannot read properties of undefined (reading \'enrollmentStats\')',
      failedApi: '/api/admin/analytics/courses',
      httpStatus: 500,
      component: 'CourseAnalyticsPage.jsx (AnalyticsDonutChart)',
      stack: `TypeError: Cannot read properties of undefined (reading 'enrollmentStats')
    at CourseAnalyticsPage (src/pages/admin/analytics/CourseAnalyticsPage.jsx:84:22)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:15486)
    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:20103)`,
      impact: 'Entire Course Analytics page failed to render; admin shown error boundary fallback',
      isCritical: true,
      severity: 'CRITICAL',
      diagnosticDetails: {
        browser: 'Google Chrome 130.0.0.0 (Windows NT 10.0)',
        screenResolution: '1920x1080',
        online: true,
        authenticatedUser: req.user?.email || 'admin@stackqueue.org'
      }
    };

    const result = await captureFrontendError(testPayload, { req });

    res.json({
      success: true,
      message: 'Test Frontend UI Error Alert captured and dispatched to admin email.',
      correlationId: result?.correlationId,
      errorId: result?.errorId,
      alertStatus: result?.alertStatus
    });
  } catch (err) {
    console.error('[ErrorMonitoringController triggerTestFrontendAlert Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to trigger test frontend alert' });
  }
};
