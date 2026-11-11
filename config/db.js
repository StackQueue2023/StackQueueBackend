const mongoose = require('mongoose');
const { captureError, flushFallbackQueue } = require('../services/errorAlertService');
const systemLogger = require('../services/systemLogger');

let isConnecting = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
const BASE_RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

const mongoOptions = {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  autoIndex: true
};

// MongoDB Connection Event Listeners
mongoose.connection.on('connected', () => {
  reconnectAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  systemLogger.info(`[MongoDB] Connection established successfully to ${mongoose.connection.host}`);
  flushFallbackQueue().catch(err => {
    systemLogger.warn(`[MongoDB Fallback Flush Error]: ${err.message}`);
  });
});

mongoose.connection.on('error', (err) => {
  systemLogger.error(`[MongoDB Event Error]: ${err.message}`, { stack: err.stack });
  captureError(err, {
    service: 'MongoDB Database Service',
    severity: 'CRITICAL',
    impact: 'Database operation failure / network socket error'
  }).catch(() => {});
});

mongoose.connection.on('disconnected', () => {
  systemLogger.warn('[MongoDB Event Disconnected]: Connection lost. Server will maintain state and reconnect.');
  captureError(new Error('MongoDB disconnected from server cluster'), {
    service: 'MongoDB Database Service',
    severity: 'HIGH',
    impact: 'MongoDB disconnected - queries will buffer or return 503 until reconnected'
  }).catch(() => {});

  // Trigger safe auto-reconnection loop if not already connecting
  scheduleReconnect();
});

mongoose.connection.on('reconnectFailed', () => {
  systemLogger.error('[MongoDB Event ReconnectFailed]: Built-in reconnect exhausted. Engaging custom backoff loop.');
  captureError(new Error('MongoDB reconnect failed after maximum internal attempts'), {
    service: 'MongoDB Database Service',
    severity: 'CRITICAL',
    impact: 'Persistent database outage - custom reconnect loop active'
  }).catch(() => {});

  scheduleReconnect();
});

function scheduleReconnect() {
  if (isConnecting || mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectAttempts++;
  const delay = Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
  systemLogger.info(`[MongoDB] Scheduling auto-reconnect attempt #${reconnectAttempts} in ${Math.round(delay / 1000)}s...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDB().catch(err => {
      systemLogger.warn(`[MongoDB Reconnect Attempt #${reconnectAttempts} Failed]: ${err.message}`);
    });
  }, delay);
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return;
  }

  isConnecting = true;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stackqueue_db';

  try {
    const conn = await mongoose.connect(uri, mongoOptions);
    isConnecting = false;
    reconnectAttempts = 0;
    systemLogger.info(`[MongoDB] Connected successfully: ${conn.connection.host}`);

    try {
      const { deduplicateColleges } = require('../controllers/adminController');
      await deduplicateColleges();
    } catch (dedupErr) {
      systemLogger.warn(`[MongoDB College Deduplication Warning]: ${dedupErr.message}`);
    }

    return conn;
  } catch (error) {
    isConnecting = false;
    systemLogger.error(`[MongoDB Connection Error]: ${error.message}`, {
      stack: error.stack,
      reconnectAttempts
    });

    // Alert admin without killing the process
    await captureError(error, {
      service: 'MongoDB Database Service',
      severity: 'CRITICAL',
      impact: 'MongoDB connection failed. Backend process is maintaining operation and retrying connection.'
    }).catch(() => {});

    // NEVER call process.exit(1). Always schedule safe retry loop.
    scheduleReconnect();
  }
};

module.exports = connectDB;
