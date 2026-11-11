/**
 * Real-Time Backend Error Monitoring & Admin Email Alert Service
 * Captures critical backend errors, database disconnections, and API failures,
 * sanitizes all diagnostics, prevents email flood via fingerprint cooldowns,
 * and delivers immediate Nodemailer email alerts to configured admin emails.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { sanitizeString, sanitizeObject, parseStackTrace, generateRemediationHint } = require('../utils/errorSanitizer');

// Local fallback queue path for DB outages
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const FALLBACK_QUEUE_FILE = path.join(LOGS_DIR, 'pending_alerts.json');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (e) {
    console.error('[ErrorMonitor] Failed to create logs directory:', e.message);
  }
}

// In-memory deduplication cache: fingerprint -> { lastSentAt, count, errorId, severity }
const fingerprintCache = new Map();

// Configuration
const COOLDOWN_MS = (parseInt(process.env.ALERT_COOLDOWN_MINUTES, 10) || 10) * 60 * 1000;
const MAX_RETRIES = parseInt(process.env.ALERT_MAX_RETRIES, 10) || 3;

/**
 * Configure Nodemailer SMTP Transporter
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const pass = process.env.SMTP_PASS || '';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

let transporter = createTransporter();

/**
 * Generate a unique error event ID: ERR-YYYYMMDD-XXXXXX
 */
function generateErrorId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ERR-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Generate fingerprint hash from normalized error properties
 */
function generateFingerprint(service, errorType, message, fileName, lineNumber) {
  // Normalize message by replacing variable numbers, hashes, and IDs
  const normalizedMsg = (message || '')
    .replace(/[0-9a-fA-F]{24}/g, 'ID')
    .replace(/\b\d+\b/g, 'N')
    .slice(0, 150);

  const rawKey = `${service || 'API'}|${errorType || 'Error'}|${normalizedMsg}|${fileName || 'unknown'}:${lineNumber || 0}`;
  return crypto.createHash('md5').update(rawKey).digest('hex');
}

/**
 * Append alert to local fallback JSON file when MongoDB is unavailable
 */
function saveToFallbackQueue(alertData) {
  try {
    let queue = [];
    if (fs.existsSync(FALLBACK_QUEUE_FILE)) {
      try {
        const fileContent = fs.readFileSync(FALLBACK_QUEUE_FILE, 'utf8');
        queue = JSON.parse(fileContent) || [];
      } catch (err) {
        queue = [];
      }
    }
    queue.push(alertData);
    // Keep max 500 items in fallback queue to prevent unlimited disk growth
    if (queue.length > 500) {
      queue = queue.slice(-500);
    }
    fs.writeFileSync(FALLBACK_QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
  } catch (fileErr) {
    console.error('[ErrorMonitor Fallback Queue Error]:', fileErr.message);
  }
}

/**
 * Flush pending alerts from fallback file to MongoDB once DB is connected
 */
async function flushFallbackQueue() {
  try {
    if (!fs.existsSync(FALLBACK_QUEUE_FILE)) return;
    const fileContent = fs.readFileSync(FALLBACK_QUEUE_FILE, 'utf8');
    const queue = JSON.parse(fileContent) || [];
    if (!queue.length) return;

    const ErrorLog = require('../models/ErrorLog');
    for (const item of queue) {
      try {
        await ErrorLog.updateOne(
          { errorId: item.errorId },
          { $setOnInsert: item },
          { upsert: true }
        );
      } catch (e) {
        // Continue with others
      }
    }
    // Clear queue after successful flush
    fs.writeFileSync(FALLBACK_QUEUE_FILE, JSON.stringify([], null, 2), 'utf8');
    console.log(`[ErrorMonitor] Flushed ${queue.length} pending error alerts from fallback queue to MongoDB.`);
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Format IST Timestamp for Indian Standard Time readability
 */
function getISTTimestamp(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date) + ' IST';
  } catch (e) {
    return date.toISOString();
  }
}

/**
 * Dynamically resolve Page Name and Module Name from Route path
 */
function resolvePageAndModule(route = '') {
  const cleanRoute = (route || '').toLowerCase().split('?')[0];

  if (cleanRoute.startsWith('/admin/analytics/courses')) return { pageName: 'Course Analytics', moduleName: 'Course Analytics' };
  if (cleanRoute.startsWith('/admin/analytics/internships')) return { pageName: 'Internship Analytics', moduleName: 'Internship Analytics' };
  if (cleanRoute.startsWith('/admin/analytics/products')) return { pageName: 'Product Analytics', moduleName: 'Product Analytics' };
  if (cleanRoute.startsWith('/admin/analytics/college-training')) return { pageName: 'College Training Analytics', moduleName: 'College Training' };
  if (cleanRoute.startsWith('/admin/analytics/college-projects')) return { pageName: 'College Projects Analytics', moduleName: 'College Projects' };
  if (cleanRoute === '/admin/analytics' || cleanRoute.startsWith('/admin/analytics/')) return { pageName: 'Admin Analytics Dashboard', moduleName: 'Analytics Overview' };

  if (cleanRoute.startsWith('/admin/courses')) return { pageName: 'Course Management', moduleName: 'Course Management' };
  if (cleanRoute.startsWith('/admin/internships')) return { pageName: 'Internship Management', moduleName: 'Internship Management' };
  if (cleanRoute.startsWith('/admin/projects')) return { pageName: 'Project Management', moduleName: 'Project Management' };
  if (cleanRoute.startsWith('/admin/batches')) return { pageName: 'Batch Management', moduleName: 'Batch & College' };
  if (cleanRoute.startsWith('/admin/tutors')) return { pageName: 'Tutor Management', moduleName: 'Tutor Management' };
  if (cleanRoute.startsWith('/admin/offers')) return { pageName: 'Offers Management', moduleName: 'Offers' };
  if (cleanRoute.startsWith('/admin/users')) return { pageName: 'User Management', moduleName: 'User Management' };
  if (cleanRoute.startsWith('/admin/error-logs')) return { pageName: 'Error Monitoring', moduleName: 'Diagnostics' };
  if (cleanRoute.startsWith('/admin/domain-management')) return { pageName: 'Domain Management', moduleName: 'Domains' };
  if (cleanRoute.startsWith('/admin/announcements')) return { pageName: 'Admin Announcements', moduleName: 'Announcements' };
  if (cleanRoute.startsWith('/admin/live-monitor')) return { pageName: 'Live Monitor', moduleName: 'Live Classes' };
  if (cleanRoute.startsWith('/admin/questions')) return { pageName: 'Question Manager', moduleName: 'Interview Prep' };
  if (cleanRoute.startsWith('/admin/inquiries')) return { pageName: 'Inquiries', moduleName: 'Inquiries' };
  if (cleanRoute.startsWith('/admin/lms')) return { pageName: 'LMS Management', moduleName: 'LMS Settings' };
  if (cleanRoute.startsWith('/admin/command-center') || cleanRoute === '/admin' || cleanRoute === '/admin/') return { pageName: 'Admin Dashboard', moduleName: 'Admin Dashboard' };

  if (cleanRoute.startsWith('/student/courses')) return { pageName: 'Course Details', moduleName: 'Student Learning' };
  if (cleanRoute.startsWith('/student/payments')) return { pageName: 'Student Payments', moduleName: 'Payments' };
  if (cleanRoute.startsWith('/student/attendance')) return { pageName: 'Student Attendance', moduleName: 'Attendance' };
  if (cleanRoute.startsWith('/student/games')) return { pageName: 'Game Hub', moduleName: 'Student Games' };
  if (cleanRoute.startsWith('/student/challenges')) return { pageName: 'Daily Challenge', moduleName: 'Daily Challenges' };
  if (cleanRoute.startsWith('/student/learning-path')) return { pageName: 'Learning Path', moduleName: 'Learning Path' };
  if (cleanRoute.startsWith('/student/leaderboard')) return { pageName: 'Leaderboard', moduleName: 'Leaderboard' };
  if (cleanRoute.startsWith('/student/achievements')) return { pageName: 'Achievements', moduleName: 'Achievements' };
  if (cleanRoute.startsWith('/student/progress')) return { pageName: 'Student Progress', moduleName: 'Student Progress' };
  if (cleanRoute.startsWith('/student/projects')) return { pageName: 'Student Projects', moduleName: 'Projects' };
  if (cleanRoute.startsWith('/student/leave')) return { pageName: 'Leave Application', moduleName: 'Leave' };
  if (cleanRoute.startsWith('/student/announcements')) return { pageName: 'Announcements', moduleName: 'Announcements' };
  if (cleanRoute.startsWith('/student/dashboard') || cleanRoute.startsWith('/student')) return { pageName: 'Student Dashboard', moduleName: 'Student Dashboard' };

  if (cleanRoute.startsWith('/trainer/assigned-students')) return { pageName: 'Assigned Students', moduleName: 'Trainer Management' };
  if (cleanRoute.startsWith('/trainer/daily-report')) return { pageName: 'Daily Report Submit', moduleName: 'Trainer Reports' };
  if (cleanRoute.startsWith('/trainer/attendance')) return { pageName: 'Tutor Attendance', moduleName: 'Attendance' };
  if (cleanRoute.startsWith('/trainer/announcements')) return { pageName: 'Tutor Announcements', moduleName: 'Announcements' };
  if (cleanRoute.startsWith('/trainer/learning-progress')) return { pageName: 'Learning Progress', moduleName: 'Learning Progress' };
  if (cleanRoute.startsWith('/trainer/payment-followup')) return { pageName: 'Payment Follow-up', moduleName: 'Payments' };
  if (cleanRoute.startsWith('/trainer/dashboard') || cleanRoute.startsWith('/trainer')) return { pageName: 'Trainer Dashboard', moduleName: 'Trainer' };

  if (cleanRoute.startsWith('/courses')) return { pageName: 'Courses Directory', moduleName: 'Public Portal' };
  if (cleanRoute.startsWith('/internships')) return { pageName: 'Internships Directory', moduleName: 'Public Portal' };
  if (cleanRoute.startsWith('/products')) return { pageName: 'Products Directory', moduleName: 'Public Portal' };
  if (cleanRoute.startsWith('/login')) return { pageName: 'Login Page', moduleName: 'Authentication' };
  if (cleanRoute.startsWith('/contact')) return { pageName: 'Contact Us', moduleName: 'Public Portal' };
  if (cleanRoute.startsWith('/about')) return { pageName: 'About Us', moduleName: 'Public Portal' };

  const segments = cleanRoute.split('/').filter(Boolean);
  if (segments.length > 0) {
    const formatted = segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' - ');
    return { pageName: formatted, moduleName: segments[0].toUpperCase() };
  }

  return { pageName: 'Main Page', moduleName: 'General UI' };
}

/**
 * Generate a unique frontend error event ID: ERR-UI-YYYYMMDD-XXXXXX
 */
function generateFrontendErrorId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ERR-UI-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Generate targeted investigation advice for frontend failures
 */
function generateFrontendRemediation(errorCategory, httpStatus, failedApi, message) {
  if (httpStatus >= 500) {
    return `1. Check backend API logs for ${failedApi || 'the endpoint'} to inspect the 5xx exception stack trace.\n2. Verify MongoDB Atlas connectivity, collection schemas, and aggregation pipelines.\n3. Ensure backend process is healthy and not restarting or hitting memory limits.`;
  }
  if (httpStatus === 0 || (message && message.toLowerCase().includes('network')) || (message && message.toLowerCase().includes('timeout'))) {
    return `1. Verify backend server is reachable from the client network and port bindings are open.\n2. Inspect CORS headers and reverse proxy configuration.\n3. Confirm whether network timeout occurred due to slow API queries or database locks.`;
  }
  if (errorCategory === 'React Render Error' || (errorCategory && errorCategory.includes('Render'))) {
    return `1. Inspect component stack trace for undefined property access (e.g., calling .map() or accessing properties of undefined/null).\n2. Verify API response JSON structure matches the frontend component props and state.\n3. Implement defensive null checks, default props, or fallback values in the rendering component.`;
  }
  if (errorCategory === 'Page Loading Timeout' || errorCategory === 'Blank Screen' || (errorCategory && errorCategory.includes('Timeout'))) {
    return `1. Check if an unhandled asynchronous promise rejection stalled the component loading spinner.\n2. Confirm whether dynamic route chunks or static assets failed to load due to stale cache.\n3. Verify that the root DOM container mounted properly and has not crashed.`;
  }
  if (errorCategory === 'Critical UI Action Failure') {
    return `1. Inspect the request payload sent by the form/action for missing required fields.\n2. Verify backend endpoint permissions, validation middleware, and database transaction status.\n3. Confirm optimistic UI updates rollback cleanly upon action failure.`;
  }
  return `1. Inspect the stack trace, component path, and browser metadata provided in this report.\n2. Reproduce the error by navigating directly to the reported route in a clean browser session.\n3. Cross-reference the correlation ID in server logs.`;
}

/**
 * Format HTML email template for Frontend Alert
 */
function buildFrontendAlertHtml(data) {
  const severityColors = {
    CRITICAL: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444', badge: '#dc2626' },
    HIGH: { bg: '#ffedd5', text: '#9a3412', border: '#f97316', badge: '#ea580c' },
    MEDIUM: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', badge: '#d97706' },
    LOW: { bg: '#f1f5f9', text: '#334155', border: '#94a3b8', badge: '#64748b' }
  };
  const color = severityColors[data.severity] || severityColors.CRITICAL;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background-color: ${color.text}; color: #ffffff; padding: 22px 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
            ⚠️ LMS Frontend Failure Alert
          </h2>
          <span style="background-color: #ffffff; color: ${color.text}; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
            ${data.severity}
          </span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.95;">
          Page: <strong>${data.pageName}</strong> &bull; Module: <strong>${data.moduleName}</strong>
        </p>
      </div>

      <!-- Main Summary -->
      <div style="padding: 24px; color: #1e293b; line-height: 1.5;">
        <div style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 14px 18px; border-radius: 4px; margin-bottom: 22px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${color.text};">
            ${data.message}
          </p>
        </div>

        <!-- Incident Metadata Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 22px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; width: 160px; font-weight: 600;">Severity:</td>
              <td style="padding: 8px 0; font-weight: 700; color: ${color.badge};">${data.severity}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Page:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${data.pageName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Route:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #0f172a;">${data.endpoint || data.route}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Module:</td>
              <td style="padding: 8px 0; color: #0f172a;">${data.moduleName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Failure Type:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${data.errorCategory || data.errorType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Failed API:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #0f172a;">${data.failedApi || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">HTTP Status:</td>
              <td style="padding: 8px 0; font-weight: 700; color: ${data.statusCode >= 500 ? '#dc2626' : '#475569'};">${data.statusCode || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Occurred At (IST):</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${data.occurredAtIST || data.timestamp}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Correlation ID:</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: 700; color: #6366f1;">${data.errorId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Impact:</td>
              <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${data.impact}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Occurrences:</td>
              <td style="padding: 8px 0; color: #0f172a;">${data.occurrences} occurrence(s)</td>
            </tr>
          </tbody>
        </table>

        <!-- Suggested Investigation / Remediation -->
        ${data.remediationHint ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534;">
              🔍 Suggested Investigation &amp; Actions
            </p>
            <div style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5; white-space: pre-line;">
              ${data.remediationHint}
            </div>
          </div>
        ` : ''}

        <!-- Diagnostic Details -->
        ${data.diagnosticDetailsHtml || ''}

        <!-- Stack Trace -->
        ${data.stack ? `
          <div style="margin-top: 18px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;">
              Component / JavaScript Stack Trace
            </p>
            <pre style="background-color: #0f172a; color: #f8fafc; padding: 14px; border-radius: 8px; font-size: 11px; line-height: 1.5; overflow-x: auto; font-family: 'Courier New', Consolas, monospace; margin: 0; white-space: pre-wrap; word-break: break-all;">${data.stack}</pre>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>STACK QUEUE — Real-Time Frontend UI Failure Monitoring</span>
        <span>Automatic Real-Time Frontend Alert</span>
      </div>
    </div>
  `;
}

/**
 * Format plain text email for Frontend Alert
 */
function buildFrontendAlertText(data) {
  return `
LMS Frontend Failure Alert
==================================================
Severity:        ${data.severity}
Page:            ${data.pageName}
Route:           ${data.endpoint || data.route}
Module:          ${data.moduleName}
Failure Type:    ${data.errorCategory || data.errorType}
Error Message:   ${data.message}
Failed API:      ${data.failedApi || 'N/A'}
HTTP Status:     ${data.statusCode || 'N/A'}
Occurred At:     ${data.occurredAtIST || data.timestamp}
Correlation ID:  ${data.errorId}
Impact:          ${data.impact}
Occurrences:     ${data.occurrences}

Suggested Investigation:
${data.remediationHint || 'Inspect route and error details in LMS Error Monitoring Dashboard'}

Diagnostic Details:
${typeof data.diagnosticDetails === 'object' ? JSON.stringify(data.diagnosticDetails, null, 2) : data.diagnosticDetails || 'N/A'}

Stack Trace:
${data.stack || 'No stack trace available'}
==================================================
`.trim();
}

/**
 * Format HTML email template for Admin Alert
 */
function buildAlertHtml(data) {
  const severityColors = {
    CRITICAL: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    HIGH: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
    MEDIUM: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    LOW: { bg: '#f1f5f9', text: '#334155', border: '#94a3b8' }
  };
  const color = severityColors[data.severity] || severityColors.HIGH;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background-color: ${color.text}; color: #ffffff; padding: 20px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
            ⚠️ LMS Backend Error Alert
          </h2>
          <span style="background-color: #ffffff; color: ${color.text}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
            ${data.severity}
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">
          Service: <strong>${data.service}</strong> | Environment: <strong>${data.environment}</strong>
        </p>
      </div>

      <!-- Main Summary -->
      <div style="padding: 24px; color: #1e293b; line-height: 1.5;">
        <div style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${color.text};">
            ${data.message}
          </p>
        </div>

        <!-- Incident Metadata Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 600;">Error ID:</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: 700; color: #0f172a;">${data.errorId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Timestamp:</td>
              <td style="padding: 8px 0; color: #0f172a;">${data.timestamp}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Endpoint / Method:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #0f172a;">${data.method} ${data.endpoint}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">HTTP Status:</td>
              <td style="padding: 8px 0; font-weight: 700; color: ${data.statusCode >= 500 ? '#dc2626' : '#d97706'};">${data.statusCode}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Request ID:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #0f172a;">${data.requestId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Source Location:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #0f172a;">${data.fileName}:${data.lineNumber || '?'} in ${data.functionName || 'unknown'}()</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Impact:</td>
              <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${data.impact}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Occurrences:</td>
              <td style="padding: 8px 0; color: #0f172a;">${data.occurrences} occurrence(s)</td>
            </tr>
          </tbody>
        </table>

        <!-- Remediation Hint -->
        ${data.remediationHint ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534;">
              💡 Immediate Remediation Hint
            </p>
            <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.4;">
              ${data.remediationHint}
            </p>
          </div>
        ` : ''}

        <!-- Stack Trace -->
        ${data.stack ? `
          <div style="margin-top: 16px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;">
              Sanitized Stack Trace
            </p>
            <pre style="background-color: #0f172a; color: #f8fafc; padding: 14px; border-radius: 8px; font-size: 11px; line-height: 1.5; overflow-x: auto; font-family: 'Courier New', Consolas, monospace; margin: 0; white-space: pre-wrap; word-break: break-all;">${data.stack}</pre>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>STACK QUEUE — Backend &amp; Database Real-Time Health Monitor</span>
        <span>Generated automatically upon backend failure</span>
      </div>
    </div>
  `;
}

/**
 * Format plain text email for Admin Alert
 */
function buildAlertText(data) {
  return `
[CRITICAL] LMS Backend Error Alert
==================================================
Error ID:        ${data.errorId}
Severity:        ${data.severity}
Service:         ${data.service}
Environment:     ${data.environment}
Timestamp:       ${data.timestamp}
Endpoint:        ${data.method} ${data.endpoint}
HTTP Status:     ${data.statusCode}
Request ID:      ${data.requestId}
Source:          ${data.fileName}:${data.lineNumber || '?'} in ${data.functionName || 'unknown'}()
Impact:          ${data.impact}
Occurrences:     ${data.occurrences}

Error Message:
${data.message}

Remediation Hint:
${data.remediationHint || 'N/A'}

Sanitized Stack Trace:
${data.stack || 'No stack trace available'}
==================================================
`.trim();
}

/**
 * Dispatch Email with Exponential Backoff Retries
 */
async function dispatchEmailWithRetry(alertData, retryCount = 0) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || 'stackqueue2023@gmail.com';
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'stackqueue2023@gmail.com';

  const isFrontend = !!alertData.isFrontend;
  const defaultSubject = isFrontend
    ? `[STACK QUEUE UI ALERT] [${alertData.severity}] ${alertData.pageName || 'Page'} Failed to Load`
    : `[STACK QUEUE ALERT] [${alertData.severity}] ${alertData.service} – ${alertData.errorId}`;

  const mailOptions = {
    from: {
      name: 'STACK QUEUE',
      address: fromEmail
    },
    to: adminEmail,
    subject: alertData.emailSubject || defaultSubject,
    text: isFrontend ? buildFrontendAlertText(alertData) : buildAlertText(alertData),
    html: isFrontend ? buildFrontendAlertHtml(alertData) : buildAlertHtml(alertData),
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High',
      'Importance': 'High'
    }
  };

  const startTime = Date.now();
  try {
    const info = await transporter.sendMail(mailOptions);
    const latency = Date.now() - startTime;
    console.log(`[ErrorMonitor Alert Sent] ${alertData.errorId} dispatched to ${adminEmail} in ${latency}ms (MessageId: ${info.messageId})`);

    // Update DB with success status
    try {
      const ErrorLog = require('../models/ErrorLog');
      await ErrorLog.updateOne(
        { errorId: alertData.errorId },
        {
          $set: {
            alertStatus: 'SENT',
            lastAlertSentAt: new Date(),
            dispatchLatencyMs: latency,
            alertAttempts: retryCount + 1
          }
        }
      );
    } catch (e) {
      // Non-blocking DB update error
    }

    return { success: true, latency };
  } catch (smtpErr) {
    console.error(`[ErrorMonitor Alert Delivery Failed] Attempt ${retryCount + 1}/${MAX_RETRIES} for ${alertData.errorId}:`, smtpErr.message);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(3, retryCount + 1) * 1000; // 3s, 9s, 27s
      setTimeout(() => {
        dispatchEmailWithRetry(alertData, retryCount + 1).catch(() => {});
      }, delay);
    } else {
      console.error(`[ErrorMonitor Alert Exhausted] Maximum retries reached for ${alertData.errorId}. Preserved in database/queue.`);
      try {
        const ErrorLog = require('../models/ErrorLog');
        await ErrorLog.updateOne(
          { errorId: alertData.errorId },
          {
            $set: {
              alertStatus: 'FAILED',
              alertError: smtpErr.message,
              alertAttempts: retryCount + 1
            }
          }
        );
      } catch (e) {
        // Non-blocking
      }
    }

    return { success: false, error: smtpErr.message };
  }
}

/**
 * Primary Real-Time Error Capture Entrypoint
 * @param {Error|Object|string} err - Error instance or error payload
 * @param {Object} context - Optional context: { req, service, severity, statusCode, impact, isInternalAlertError }
 */
async function captureError(err, context = {}) {
  // CRITICAL ANTI-LOOP GUARD: Never capture errors generated within the alert system itself
  if (context.isInternalAlertError) {
    console.error('[ErrorMonitor Internal Guard Bypass]', err?.message || err);
    return null;
  }

  const startTime = Date.now();

  try {
    const req = context.req || null;
    const errorObj = typeof err === 'object' && err !== null ? err : new Error(String(err));
    const rawMessage = errorObj.message || String(err) || 'Unknown Server Error';
    const errorType = errorObj.name || 'Error';
    const rawStack = errorObj.stack || '';

    // Sanitize message & stack
    const message = sanitizeString(rawMessage);
    const stack = sanitizeString(rawStack);

    // Extract file, line, function
    const stackDetails = parseStackTrace(rawStack);

    // Context attributes
    const service = context.service || (req ? 'Express API' : 'Institute Backend System');
    const endpoint = req ? req.originalUrl || req.url : context.endpoint || 'N/A';
    const method = req ? req.method : context.method || 'N/A';
    const statusCode = context.statusCode || (req?.res?.statusCode >= 400 ? req.res.statusCode : 500);
    const requestId = req?.requestId || context.requestId || 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const environment = process.env.NODE_ENV || 'development';

    // Determine severity
    let severity = context.severity;
    if (!severity) {
      if (statusCode >= 500 || service.toLowerCase().includes('mongo') || service.toLowerCase().includes('database')) {
        severity = 'CRITICAL';
      } else if (statusCode >= 400) {
        severity = 'HIGH';
      } else {
        severity = 'MEDIUM';
      }
    }

    const impact = context.impact || (statusCode >= 500 ? 'Backend API operation failed with 5xx error' : 'Service operation failed');
    const remediationHint = generateRemediationHint(errorObj, service);

    // Build fingerprint for deduplication
    const fingerprint = generateFingerprint(service, errorType, message, stackDetails.fileName, stackDetails.lineNumber);

    // Extract sanitized request details if req exists
    let requestDetails = null;
    if (req) {
      requestDetails = {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get ? req.get('User-Agent') : undefined,
        headers: sanitizeObject(req.headers || {}),
        body: sanitizeObject(req.body || {}),
        query: sanitizeObject(req.query || {}),
        params: sanitizeObject(req.params || {})
      };
    }

    const now = new Date();
    const errorId = generateErrorId();

    // Check Deduplication & Cooldown in Cache
    const cached = fingerprintCache.get(fingerprint);
    let shouldSendEmail = true;
    let isEscalation = false;
    let occurrences = 1;

    if (cached) {
      const timeSinceLast = now - cached.lastSentAt;
      cached.count += 1;
      occurrences = cached.count;

      if (timeSinceLast < COOLDOWN_MS) {
        // Within cooldown window:
        // If severity escalated (e.g. from HIGH to CRITICAL), alert immediately!
        if (severity === 'CRITICAL' && cached.severity !== 'CRITICAL') {
          shouldSendEmail = true;
          isEscalation = true;
          cached.severity = severity;
          cached.lastSentAt = now;
        } else {
          // Suppress duplicate email, but log to database
          shouldSendEmail = false;
        }
      } else {
        // Cooldown expired and error is still occurring: send escalation summary alert
        shouldSendEmail = true;
        isEscalation = true;
        cached.lastSentAt = now;
        cached.severity = severity;
      }
    } else {
      // First occurrence of this fingerprint: send immediately!
      fingerprintCache.set(fingerprint, {
        lastSentAt: now,
        count: 1,
        errorId,
        severity
      });
    }

    const alertStatus = shouldSendEmail ? 'PENDING' : 'THROTTLED';

    const alertData = {
      errorId,
      fingerprint,
      severity,
      errorType,
      message,
      stack,
      service,
      endpoint,
      method,
      statusCode,
      requestId,
      environment,
      fileName: stackDetails.fileName,
      functionName: stackDetails.functionName,
      lineNumber: stackDetails.lineNumber,
      columnNumber: stackDetails.columnNumber,
      requestDetails,
      remediationHint,
      impact,
      occurrences,
      alertStatus,
      timestamp: now.toLocaleString('en-US', { timeZoneName: 'short' }),
      firstOccurredAt: now,
      lastOccurredAt: now
    };

    // Save to Database (or Fallback File if DB is down)
    try {
      const ErrorLog = require('../models/ErrorLog');
      // If error already exists with this fingerprint, update occurrences and lastOccurredAt
      const existingDoc = await ErrorLog.findOne({ fingerprint, isResolved: false });
      if (existingDoc) {
        existingDoc.occurrences += 1;
        existingDoc.lastOccurredAt = now;
        if (shouldSendEmail) {
          existingDoc.alertStatus = 'PENDING';
          existingDoc.errorId = errorId; // update to latest error ID for alert correlation
        }
        await existingDoc.save();
        alertData.occurrences = existingDoc.occurrences;
      } else {
        await ErrorLog.create(alertData);
      }
    } catch (dbErr) {
      console.error(`[ErrorMonitor DB Write Failed] ${dbErr.message} — Writing to local fallback queue`);
      saveToFallbackQueue(alertData);
    }

    // Trigger Email Alert Immediately (Event-driven, asynchronous)
    if (shouldSendEmail) {
      if (isEscalation) {
        alertData.message = `[ESCALATION - Occurred ${occurrences} times] ` + alertData.message;
      }
      // Non-blocking fire-and-forget promise
      dispatchEmailWithRetry(alertData).catch(err => {
        console.error('[ErrorMonitor Dispatch Error]', err.message);
      });
    } else {
      console.log(`[ErrorMonitor Throttled] Duplicate error (${fingerprint}) throttled under ${COOLDOWN_MS / 60000}m cooldown. Total occurrences: ${occurrences}`);
    }

    return alertData;
  } catch (fatalInternalErr) {
    // Prevent any infinite loop or unhandled exception in error logger
    console.error('[ErrorMonitor Critical Internal Failure]', fatalInternalErr.message);
    return null;
  }
}

/**
 * Capture Frontend UI Loading Failure & Dispatch Admin Email Alert
 * @param {Object} payload - { pageName, route, moduleName, errorCategory, errorMessage, failedApi, httpStatus, component, stack, correlationId, impact, diagnosticDetails, isCritical, severity, suggestedAction }
 * @param {Object} context - Optional context
 */
async function captureFrontendError(payload = {}, context = {}) {
  // CRITICAL ANTI-LOOP GUARD
  if (context.isInternalAlertError) return null;

  try {
    const route = payload.route || (context.req ? context.req.originalUrl || context.req.url : '/');
    const resolved = resolvePageAndModule(route);
    const pageName = sanitizeString(payload.pageName || resolved.pageName || 'Unknown Page');
    const moduleName = sanitizeString(payload.moduleName || resolved.moduleName || 'LMS Platform');
    const errorCategory = sanitizeString(payload.errorCategory || payload.failureType || 'UI Failure');
    const rawMessage = payload.errorMessage || payload.message || 'Unknown frontend rendering or loading failure';
    const message = sanitizeString(rawMessage);
    const stack = sanitizeString(payload.stack || '');
    const failedApi = sanitizeString(payload.failedApi || '');
    const statusCode = parseInt(payload.httpStatus || payload.statusCode, 10) || (failedApi ? 500 : 0);
    const correlationId = payload.correlationId || generateFrontendErrorId();
    const isCritical = payload.isCritical !== undefined
      ? Boolean(payload.isCritical)
      : (statusCode >= 500 || errorCategory.toLowerCase().includes('render') || errorCategory.toLowerCase().includes('timeout') || errorCategory.toLowerCase().includes('blank'));
    const severity = payload.severity || (isCritical ? 'CRITICAL' : 'HIGH');
    const impact = sanitizeString(payload.impact || (isCritical ? `Entire ${pageName} page failed to load or render properly` : `${pageName} feature encountered an unexpected failure`));
    const environment = process.env.NODE_ENV || 'development';

    const now = new Date();
    const occurredAtIST = getISTTimestamp(now);

    // Format diagnostic details
    const sanitizedDiagnostics = sanitizeObject(payload.diagnosticDetails || {});
    let diagnosticDetailsHtml = '';
    const diagEntries = Object.entries(sanitizedDiagnostics);
    if (diagEntries.length > 0) {
      diagnosticDetailsHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569;">
            📋 Diagnostic Details
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            ${diagEntries.map(([k, v]) => `
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 140px; font-weight: 600;">${k}:</td>
                <td style="padding: 4px 0; font-family: monospace; color: #0f172a;">${typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const remediationHint = payload.suggestedAction || generateFrontendRemediation(errorCategory, statusCode, failedApi, message);

    // Build fingerprint for deduplication
    const normalizedMsg = (message || '')
      .replace(/[0-9a-fA-F]{24}/g, 'ID')
      .replace(/\b\d+\b/g, 'N')
      .slice(0, 150);
    const rawFingerprintKey = `FRONTEND|${route}|${errorCategory}|${normalizedMsg}`;
    const fingerprint = crypto.createHash('md5').update(rawFingerprintKey).digest('hex');

    // Deduplication check
    const cached = fingerprintCache.get(fingerprint);
    let shouldSendEmail = true;
    let occurrences = 1;
    let isEscalation = false;

    if (cached) {
      const timeSinceLast = now - cached.lastSentAt;
      cached.count += 1;
      occurrences = cached.count;

      if (timeSinceLast < COOLDOWN_MS) {
        if (severity === 'CRITICAL' && cached.severity !== 'CRITICAL') {
          shouldSendEmail = true;
          isEscalation = true;
          cached.severity = severity;
          cached.lastSentAt = now;
        } else {
          shouldSendEmail = false;
        }
      } else {
        shouldSendEmail = true;
        isEscalation = true;
        cached.lastSentAt = now;
        cached.severity = severity;
      }
    } else {
      fingerprintCache.set(fingerprint, {
        lastSentAt: now,
        count: 1,
        errorId: correlationId,
        severity
      });
    }

    const alertStatus = shouldSendEmail ? 'PENDING' : 'THROTTLED';

    const alertData = {
      errorId: correlationId,
      fingerprint,
      severity,
      errorType: errorCategory,
      errorCategory,
      message,
      stack,
      service: `Frontend UI (${moduleName})`,
      endpoint: route,
      method: failedApi ? 'API' : 'UI_RENDER',
      statusCode,
      requestId: correlationId,
      environment,
      fileName: payload.component || 'Frontend UI Component',
      functionName: payload.component ? 'ReactComponent' : 'PageRenderer',
      pageName,
      moduleName,
      failedApi,
      isFrontend: true,
      diagnosticDetails: sanitizedDiagnostics,
      diagnosticDetailsHtml,
      remediationHint,
      impact,
      occurrences,
      alertStatus,
      occurredAtIST,
      timestamp: occurredAtIST,
      firstOccurredAt: now,
      lastOccurredAt: now,
      emailSubject: `[STACK QUEUE UI ALERT] [${severity}] ${pageName} Failed to Load`
    };

    // Save to Database (or Fallback File)
    try {
      const ErrorLog = require('../models/ErrorLog');
      const existingDoc = await ErrorLog.findOne({ fingerprint, isResolved: false });
      if (existingDoc) {
        existingDoc.occurrences += 1;
        existingDoc.lastOccurredAt = now;
        if (shouldSendEmail) {
          existingDoc.alertStatus = 'PENDING';
          existingDoc.errorId = correlationId;
        }
        await existingDoc.save();
        alertData.occurrences = existingDoc.occurrences;
      } else {
        await ErrorLog.create(alertData);
      }
    } catch (dbErr) {
      console.error(`[Frontend ErrorMonitor DB Write Failed] ${dbErr.message} — writing fallback`);
      saveToFallbackQueue(alertData);
    }

    // Trigger Email Alert Immediately
    if (shouldSendEmail) {
      if (isEscalation) {
        alertData.message = `[ESCALATION - Occurred ${occurrences} times] ` + alertData.message;
      }
      dispatchEmailWithRetry(alertData).catch(err => {
        console.error('[Frontend ErrorMonitor Dispatch Error]', err.message);
      });
    } else {
      console.log(`[Frontend ErrorMonitor Throttled] Duplicate error (${fingerprint}) throttled under ${COOLDOWN_MS / 60000}m cooldown. Total occurrences: ${occurrences}`);
    }

    return {
      success: true,
      correlationId,
      errorId: correlationId,
      throttled: !shouldSendEmail,
      occurrences,
      alertStatus,
      pageName,
      moduleName,
      occurredAtIST
    };
  } catch (err) {
    console.error('[Frontend ErrorMonitor Critical Exception]', err);
    return null;
  }
}

module.exports = {
  captureError,
  captureFrontendError,
  dispatchEmailWithRetry,
  flushFallbackQueue,
  generateFingerprint,
  generateErrorId,
  generateFrontendErrorId,
  resolvePageAndModule,
  getISTTimestamp
};
