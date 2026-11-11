const path = require('path');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '.env')) ? path.join(__dirname, '.env') : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const crypto = require('crypto');
const { captureError } = require('./services/errorAlertService');
const systemLogger = require('./services/systemLogger');

// Process-Level Exception & Rejection Handlers — Bulletproof Error Containment
process.on('unhandledRejection', (reason, promise) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  systemLogger.error(`[Process Unhandled Rejection]: ${err.message}`, {
    stack: err.stack,
    type: 'unhandledRejection'
  });
  captureError(err, {
    service: 'Node.js Process (Unhandled Rejection)',
    severity: 'HIGH',
    impact: 'Asynchronous promise rejected without an error handler. Process maintained running.'
  }).catch(() => {});
});

process.on('uncaughtException', async (err) => {
  systemLogger.fatal(`[Process Uncaught Exception]: ${err.message}`, {
    stack: err.stack,
    type: 'uncaughtException'
  });
  try {
    await captureError(err, {
      service: 'Node.js Process (Uncaught Exception)',
      severity: 'CRITICAL',
      impact: 'Fatal uncaught exception captured in process runtime.'
    });
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
connectDB();

const app = express();


// Middleware
app.use(cors({
  origin: '*',
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

// Health Check with Database Status
const mongoose = require('mongoose');
app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    platform: 'STACK QUEUE Institute API',
    database: dbState,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/trainer', require('./routes/trainerRoutes'));
app.use('/api/admin/batches', require('./routes/batchRoutes'));
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

// Start schedulers
initBatchScheduler();
initLiveClassReminderScheduler();
initFeeReminderScheduler();

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
const server = app.listen(PORT, () => {
  systemLogger.info(`[STACK QUEUE API] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode (PID: ${process.pid})`);
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

module.exports = { app, server };
