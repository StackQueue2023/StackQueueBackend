const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const ERROR_LOG_FILE = path.join(LOGS_DIR, 'error.log');
const SYSTEM_LOG_FILE = path.join(LOGS_DIR, 'system.log');
const CRASH_LOG_FILE = path.join(LOGS_DIR, 'crash.log');

if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (e) {
    console.error('[SystemLogger] Failed to create logs directory:', e.message);
  }
}

// In-memory ring buffer of recent events for quick Admin dashboard lookup
const MAX_BUFFER_SIZE = 100;
const eventRingBuffer = [];

function appendToBuffer(entry) {
  if (eventRingBuffer.length >= MAX_BUFFER_SIZE) {
    eventRingBuffer.shift();
  }
  eventRingBuffer.push(entry);
}

function safeAppendFile(filePath, content) {
  try {
    // Check file size, if > 20MB, archive it
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 20 * 1024 * 1024) {
        const archivedPath = `${filePath}.${Date.now()}.bak`;
        fs.renameSync(filePath, archivedPath);
      }
    }
    fs.appendFileSync(filePath, content + '\n', 'utf8');
  } catch (err) {
    console.error(`[SystemLogger] Failed to write to ${filePath}:`, err.message);
  }
}

function formatLogEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const mem = process.memoryUsage();
  const entry = {
    timestamp,
    level,
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
    },
    message,
    ...meta
  };

  appendToBuffer(entry);
  return JSON.stringify(entry);
}

const systemLogger = {
  info: (message, meta = {}) => {
    const entry = formatLogEntry('INFO', message, meta);
    console.log(`[INFO] ${message}`);
    safeAppendFile(SYSTEM_LOG_FILE, entry);
  },

  warn: (message, meta = {}) => {
    const entry = formatLogEntry('WARN', message, meta);
    console.warn(`[WARN] ${message}`);
    safeAppendFile(SYSTEM_LOG_FILE, entry);
  },

  error: (message, meta = {}) => {
    const entry = formatLogEntry('ERROR', message, meta);
    console.error(`[ERROR] ${message}`);
    safeAppendFile(ERROR_LOG_FILE, entry);
    safeAppendFile(SYSTEM_LOG_FILE, entry);
  },

  fatal: (message, meta = {}) => {
    const entry = formatLogEntry('FATAL', message, meta);
    console.error(`[FATAL] ${message}`);
    safeAppendFile(CRASH_LOG_FILE, entry);
    safeAppendFile(ERROR_LOG_FILE, entry);
    safeAppendFile(SYSTEM_LOG_FILE, entry);
  },

  getRecentEvents: (limit = 50, filterLevel = null) => {
    let events = [...eventRingBuffer].reverse();
    if (filterLevel) {
      events = events.filter(e => e.level.toUpperCase() === filterLevel.toUpperCase());
    }
    return events.slice(0, limit);
  },

  getSystemMetrics: () => {
    const mem = process.memoryUsage();
    return {
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memoryMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024)
      },
      cpuUsage: process.cpuUsage()
    };
  }
};

module.exports = systemLogger;
