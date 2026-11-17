const path = require('path');
const fs = require('fs');
if (!process.env.VERCEL) {
  const envPath = fs.existsSync(path.join(__dirname, '.env')) ? path.join(__dirname, '.env') : path.join(__dirname, '..', '.env');
  require('dotenv').config({ path: envPath });
}
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const crypto = require('crypto');
const { captureError } = require('./services/errorAlertService');
const systemLogger = require('./services/systemLogger');
const {
  requestDiagnosticsMiddleware,
  recordCrashState,
  getDiagnosticsSummary,
  getLastRequest
} = require('./services/requestDiagnosticsService');

// Process-Level Exception & Rejection Handlers — Bulletproof Error Containment
process.on('unhandledRejection', (reason, promise) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  systemLogger.error(`[Process Unhandled Rejection]: ${err.message}`, {
    stack: err.stack,
    type: 'unhandledRejection',
    lastRequest: getLastRequest()
  });
  captureError(err, {
    service: 'Node.js Process (Unhandled Rejection)',
    severity: 'HIGH',
    impact: 'Asynchronous promise rejected without an error handler. Process maintained running without exit.',
    diagnosticDetails: { lastRequest: getLastRequest() }
  }).catch(() => {});
});

process.on('uncaughtException', async (err) => {
  systemLogger.fatal(`[Process Uncaught Exception]: ${err.message}`, {
    stack: err.stack,
    type: 'uncaughtException',
    lastRequest: getLastRequest()
  });

  // Record complete crash state and dispatch immediate emergency admin email
  try {
    await recordCrashState(err, 'UNCAUGHT_EXCEPTION', 1);
  } catch (alertErr) {
    systemLogger.error(`[Emergency Alert Failed]: ${alertErr.message}`);
  }

  // If supervised by watchdog daemon or PM2, exit cleanly so the supervisor restarts cleanly with backoff.
  // If running standalone, maintain the process unless it's a fatal out-of-memory or V8 corruption.
  const isSupervised = process.env.SUPERVISED_BY_DAEMON === 'true' || process.env.pm_id !== undefined;
  if (isSupervised) {
    systemLogger.warn('[Process] Supervised environment detected. Initiating clean recovery restart via supervisor...');
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  } else {
    systemLogger.warn('[Process] Standalone mode: Recovering from uncaught exception. Server remains active.');
  }
});

// Connect to MongoDB
if (!process.env.VERCEL || process.env.MONGODB_URI) {
  connectDB();
}

const app = express();

// Ensure Database Connection in Serverless / Cold-Start Environments
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (_) {}
  }
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Malformed JSON Syntax Error Guard (Prevents invalid payloads from bubbling up as unhandled server crashes)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    systemLogger.warn(`[Malformed JSON Request]: ${req.method} ${req.originalUrl} from ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received. Please verify request body syntax.',
      requestId: req.requestId
    });
  }
  next(err);
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request ID & Correlation Tracking Middleware
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `REQ-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Real-Time Request Lifecycle & Diagnostics Tracking Middleware
app.use(requestDiagnosticsMiddleware);

// Root endpoint to verify server status from browser / Vercel
app.get('/', (req, res) => {
  const isVercel = !!process.env.VERCEL;
  const hasDbUri = !!process.env.MONGODB_URI;
  res.status(200).json({
    success: true,
    message: 'STACK QUEUE Backend API is running successfully.',
    environment: isVercel ? 'Vercel Serverless' : (process.env.NODE_ENV || 'development'),
    databaseConfigured: hasDbUri,
    databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : (hasDbUri ? 'connecting' : 'MONGODB_URI missing in Environment Variables'),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      monitoring: '/api/monitoring/system-health',
      diagnostics: '/api/monitoring/request-diagnostics'
    }
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'STACK QUEUE API Root',
    status: 'online'
  });
});

// Health Check with Database Status
app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const hasDbUri = !!process.env.MONGODB_URI;
  const dbState = hasDbUri ? (dbStates[mongoose.connection.readyState] || 'unknown') : 'MONGODB_URI not set in Vercel';
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy || !process.env.VERCEL ? (isHealthy ? 200 : 503) : 200).json({
    status: isHealthy ? 'healthy' : (hasDbUri ? 'degraded' : 'setup_required'),
    platform: 'STACK QUEUE Institute API',
    database: dbState,
    notice: hasDbUri ? undefined : 'Please add MONGODB_URI to your Vercel Project Settings -> Environment Variables',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Real-Time Request Performance & Diagnostic Flight-Recorder Endpoint
app.get('/api/monitoring/request-diagnostics', (req, res) => {
  res.json({
    success: true,
    data: getDiagnosticsSummary()
  });
});

// Comprehensive Real-Time System Health & Diagnostics Endpoint
app.get('/api/monitoring/system-health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';
  const metrics = systemLogger.getSystemMetrics();
  const recentLogs = systemLogger.getRecentEvents(25);

  res.json({
    success: true,
    platform: 'STACK QUEUE Enterprise Core',
    status: mongoose.connection.readyState === 1 ? 'operational' : 'degraded',
    uptimeSeconds: metrics.uptimeSeconds,
    pid: metrics.pid,
    supervised: process.env.SUPERVISED_BY_DAEMON === 'true' || process.env.pm_id !== undefined,
    supervisorType: process.env.pm_id !== undefined ? 'PM2' : (process.env.SUPERVISED_BY_DAEMON === 'true' ? 'WatchdogDaemon' : 'Standalone'),
    daemonRestartCount: process.env.DAEMON_RESTART_COUNT || '0',
    memory: metrics.memoryMB,
    database: {
      state: dbState,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'offline',
      name: mongoose.connection.name || 'stackqueue'
    },
    schedulers: {
      batchScheduler: 'active',
      liveClassReminderScheduler: 'active',
      feeReminderScheduler: 'active'
    },
    recentEventsCount: recentLogs.length,
    recentEvents: recentLogs
  });
});


const { initBatchScheduler } = require('./services/batchReportScheduler');
const { initLiveClassReminderScheduler } = require('./services/sessionReminderScheduler');
const { initFeeReminderScheduler } = require('./services/feeReminderScheduler');
const { initTrainingReportScheduler } = require('./services/trainingReportScheduler');

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/trainer', require('./routes/trainerRoutes'));
app.use('/api/admin/batches', require('./routes/batchRoutes'));
app.use('/api/admin/departments', require('./routes/departmentRoutes'));
app.use('/api/admin/tutors', require('./routes/adminTutorRoutes'));
app.use('/api/admin/offers', require('./routes/offerRoutes'));
app.use('/api/tutors/email', require('./routes/tutorEmailRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/tasks', require('./routes/studentTaskRoutes'));
app.use('/api/guidance', require('./routes/guidanceRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));
app.use('/api/interview-arena', require('./routes/interviewRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/lms', require('./routes/lmsRoutes'));
app.use('/api/portal', require('./routes/portalRoutes'));
app.use('/api/domain', require('./routes/domainRoutes'));
app.use('/api/tutor/domain', require('./routes/tutorDomainRoutes'));
app.use('/api/admin/syllabus', require('./routes/adminSyllabusRoutes'));
app.use('/api/admin/domain-management', require('./routes/adminDomainRoutes'));
app.use('/api/admin/analytics', require('./routes/adminAnalyticsRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/tutor/progress', require('./routes/tutorProgressRoutes'));
app.use('/api/monitoring', require('./routes/monitoringRoutes'));
app.use('/api/training-management', require('./routes/trainingManagementRoutes'));
app.use('/api/college-financial', require('./routes/collegeFinancialRoutes'));
app.use('/api/adaptive-questions', require('./routes/adaptiveQuestionRoutes'));
app.use('/api/workspace', require('./routes/workspaceRoutes'));
app.use('/api', require('./routes/collegeTrainingSyllabusRoutes'));

// Start schedulers (Only in persistent server / local daemon environments, never in serverless functions)
if (!process.env.VERCEL) {
  try {
    initBatchScheduler();
    initLiveClassReminderScheduler();
    initFeeReminderScheduler();
    initTrainingReportScheduler();
  } catch (schedErr) {
    systemLogger.warn(`[Schedulers Init Warning]: ${schedErr.message}`);
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err);
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    const keyValMatch = err.message.match(/dup key:\s*\{\s*(\w+):\s*"([^"]+)"\s*\}/) || err.message.match(/dup key:\s*\{\s*(\w+):\s*([^\s}]+)\s*\}/);
    if (keyValMatch) {
      const field = keyValMatch[1];
      const val = keyValMatch[2];
      const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
      if (err.message.includes('colleges')) {
        message = `College ${fieldLabel} '${val}' already exists. Please enter a unique ${field}.`;
      } else if (err.message.includes('batches')) {
        message = `Batch ${fieldLabel} '${val}' already exists. Please enter a unique ${field}.`;
      } else {
        message = `${fieldLabel} '${val}' already exists. Please enter a unique ${field}.`;
      }
    } else {
      message = 'Record already exists. Please enter a unique value.';
    }
    return res.status(400).json({ success: false, message, requestId: req.requestId });
  }

  // Trigger Real-Time Error Alert for 5xx or unhandled operational failures
  if (statusCode >= 500) {
    systemLogger.error(`[API 500 Error] ${req.method} ${req.originalUrl}: ${message}`, {
      stack: err.stack,
      requestId: req.requestId,
      ip: req.ip
    });
    captureError(err, {
      req,
      service: 'Express API Server',
      statusCode,
      severity: 'CRITICAL',
      impact: `HTTP ${statusCode} server exception on ${req.method} ${req.originalUrl}`
    }).catch(() => {});
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? (process.env.NODE_ENV === 'production' ? 'Internal Server Error. The issue has been reported.' : message) : message,
    requestId: req.requestId
  });
});

const PORT = process.env.PORT || 5000;
let server = null;

// Only listen locally or in standard VM/container environments. In Vercel serverless functions, export app directly.
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    systemLogger.info(`[STACK QUEUE API] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode (PID: ${process.pid})`);

    // Configure resilient HTTP timeouts
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 125000;
    server.requestTimeout = 300000;

    // Run startup recovery for any orphaned/stalled generation jobs
    try {
      const { autoRecoverStalledJobs } = require('./services/syllabusBackgroundJobService');
      autoRecoverStalledJobs().catch(() => {});
    } catch (_) {}
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      systemLogger.warn(`[Port Conflict] Port ${PORT} is temporarily busy. Retrying in 2 seconds...`);
      setTimeout(() => {
        try {
          server.close();
        } catch (_) {}
        server.listen(PORT);
      }, 2000);
    } else {
      systemLogger.fatal(`[Server Listen Error]: ${err.message}`, { stack: err.stack });
    }
  });

  // Graceful Manual Stop Handling (Stops ONLY on explicit manual termination)
  let isShuttingDown = false;
  const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    systemLogger.info(`[Process] Manual stop signal (${signal}) received. Commencing graceful shutdown...`);

    // Close HTTP server to stop accepting new requests
    server.close(() => {
      systemLogger.info('[Process] HTTP server closed gracefully.');

      // Close MongoDB connection cleanly
      mongoose.connection.close(false).then(() => {
        systemLogger.info('[Process] MongoDB connections closed. Terminating process cleanly with code 0.');
        process.exit(0);
      }).catch((dbErr) => {
        systemLogger.warn(`[Process] DB close warning during shutdown: ${dbErr.message}`);
        process.exit(0);
      });
    });

    // Force kill if graceful close hangs beyond 5 seconds
    setTimeout(() => {
      systemLogger.warn('[Process] Shutdown exceeded 5s timeout. Forcing exit.');
      process.exit(0);
    }, 5000).unref();
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
