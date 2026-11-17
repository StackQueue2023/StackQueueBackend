/**
 * STACK QUEUE — Request Lifecycle & Diagnostic Performance Service
 * 
 * Provides:
 * 1. Real-time request tracing: endpoint, request count, response time, memory usage.
 * 2. In-flight request tracking & detection of duplicate/repeated requests.
 * 3. Last-Request-Before-Crash flight recorder.
 * 4. Immediate admin crash alert dispatcher with full diagnostic payload.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { captureError } = require('./errorAlertService');
const systemLogger = require('./systemLogger');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LAST_CRASH_FILE = path.join(LOGS_DIR, 'last_crash_state.json');

if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (_) {}
}

// In-Memory Rolling Buffers
const MAX_HISTORY = 50;
const requestHistory = [];
const slowRequests = [];
const endpointStats = new Map();

let totalRequestsCount = 0;
let inFlightCount = 0;
let lastRequest = null;

/**
 * Infer frontend page name from request Referer or URL
 */
function inferPageFromRequest(req) {
  const referer = req.headers['referer'] || req.headers['referrer'] || '';
  if (referer) {
    try {
      const urlObj = new URL(referer);
      return urlObj.pathname;
    } catch (_) {
      return referer;
    }
  }

  // Fallback to API URL mapping
  const url = (req.originalUrl || req.url || '').split('?')[0];
  if (url.includes('/admin/domain-management') || url.includes('/admin/syllabus')) return 'Admin Domain/Course Management';
  if (url.includes('/admin/batches') || url.includes('/admin/colleges')) return 'Admin Batch & College Management';
  if (url.includes('/admin/lms')) return 'Admin LMS Management';
  if (url.includes('/admin/tutors')) return 'Admin Tutor Management';
  if (url.includes('/admin/analytics')) return 'Admin Analytics Dashboard';
  if (url.includes('/portal/homepage-data')) return 'Public Homepage';
  if (url.includes('/portal/courses')) return 'Public Courses Directory';
  if (url.includes('/adaptive-questions')) return 'Student Adaptive Question Runner';
  if (url.includes('/domain/')) return 'Student Course Details / Learning';
  if (url.includes('/training-management')) return 'College Training Management';
  return url;
}

/**
 * Express Request Diagnostics Middleware
 */
function requestDiagnosticsMiddleware(req, res, next) {
  totalRequestsCount++;
  inFlightCount++;

  const startTime = Date.now();
  const startMem = process.memoryUsage().heapUsed;
  const page = inferPageFromRequest(req);

  // Flight-Recorder: Update lastRequest immediately upon arrival
  lastRequest = {
    requestId: req.requestId || `REQ-${Date.now()}`,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    page,
    ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown',
    timestamp: new Date().toISOString(),
    query: req.query || {},
    inFlightCount,
    memoryMB: Math.round(startMem / 1024 / 1024)
  };

  // Track endpoint request frequency
  const epKey = `${req.method} ${req.path}`;
  const currentStat = endpointStats.get(epKey) || { count: 0, totalDuration: 0, errors: 0 };
  currentStat.count++;
  endpointStats.set(epKey, currentStat);

  // Hook into response completion
  res.on('finish', () => {
    inFlightCount = Math.max(0, inFlightCount - 1);
    const durationMs = Date.now() - startTime;
    const endMem = process.memoryUsage().heapUsed;
    const memDeltaMB = Math.round((endMem - startMem) / 1024 / 1024);

    currentStat.totalDuration += durationMs;
    if (res.statusCode >= 400) {
      currentStat.errors++;
    }

    const entry = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      page,
      status: res.statusCode,
      durationMs,
      memDeltaMB,
      memoryMB: Math.round(endMem / 1024 / 1024),
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1'
    };

    // Store in circular history buffer
    if (requestHistory.length >= MAX_HISTORY) {
      requestHistory.shift();
    }
    requestHistory.push(entry);

    // Record slow queries/requests (> 1500ms)
    if (durationMs > 1500) {
      if (slowRequests.length >= 20) slowRequests.shift();
      slowRequests.push({ ...entry, isSlow: true });
      systemLogger.warn(`[Slow Request Warning] ${req.method} ${req.originalUrl} took ${durationMs}ms`);
    }
  });

  next();
}

/**
 * Capture full snapshot of process state before any unexpected crash or termination
 */
async function recordCrashState(error, restartReason = 'UNCAUGHT_EXCEPTION', exitCode = 1) {
  const timestamp = new Date().toISOString();
  const mem = process.memoryUsage();
  const cpuUsage = process.cpuUsage ? process.cpuUsage() : {};

  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  const crashSnapshot = {
    timestamp,
    exitCode,
    restartReason,
    error: {
      message: error?.message || String(error),
      name: error?.name || 'Error',
      stack: error?.stack || ''
    },
    lastApiRequest: lastRequest,
    affectedPage: lastRequest?.page || 'Unknown Page',
    systemMetrics: {
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024)
      },
      cpuUsageUser: Math.round(cpuUsage.user / 1000),
      cpuUsageSystem: Math.round(cpuUsage.system / 1000),
      inFlightRequests: inFlightCount,
      totalRequestsServed: totalRequestsCount
    },
    databaseConnectionStatus: {
      state: dbStatus,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'offline',
      name: mongoose.connection.name || 'stackqueue'
    },
    recentRequestsBuffer: requestHistory.slice(-10)
  };

  // 1. Write crash snapshot to disk
  try {
    fs.writeFileSync(LAST_CRASH_FILE, JSON.stringify(crashSnapshot, null, 2), 'utf8');
    systemLogger.fatal(`[Process Flight Recorder] Crash state saved to ${LAST_CRASH_FILE}`);
  } catch (writeErr) {
    console.error('[Process Flight Recorder] Failed to write crash snapshot:', writeErr.message);
  }

  // 2. Dispatch immediate Critical Alert email to Admin
  try {
    await captureError(error || new Error(restartReason), {
      service: 'Node.js Backend Runtime Crash Monitor',
      severity: 'CRITICAL',
      impact: `Backend process unexpectedly halted (${restartReason}, Exit Code: ${exitCode}). Last API: ${lastRequest?.method || ''} ${lastRequest?.url || 'N/A'}.`,
      diagnosticDetails: crashSnapshot
    });
    systemLogger.info('[Process Flight Recorder] Emergency Admin alert email dispatched successfully.');
  } catch (emailErr) {
    console.error('[Process Flight Recorder] Emergency email dispatch failed:', emailErr.message);
  }

  return crashSnapshot;
}

/**
 * Get comprehensive diagnostics summary for monitoring API
 */
function getDiagnosticsSummary() {
  const mem = process.memoryUsage();
  return {
    totalRequests: totalRequestsCount,
    inFlightRequests: inFlightCount,
    lastRequest,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
    },
    databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    recentRequests: requestHistory.slice(-25),
    slowRequests: slowRequests.slice(-10),
    topEndpoints: Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgDurationMs: Math.round(stats.totalDuration / Math.max(1, stats.count)),
        errors: stats.errors
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  };
}

module.exports = {
  requestDiagnosticsMiddleware,
  recordCrashState,
  getDiagnosticsSummary,
  getLastRequest: () => lastRequest
};
