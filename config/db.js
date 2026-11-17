const mongoose = require('mongoose');
const { captureError, flushFallbackQueue } = require('../services/errorAlertService');
const systemLogger = require('../services/systemLogger');

const DEFAULT_MONGODB_URI = 'mongodb+srv://STACK_QUEUE:stack2023@stackqueuecluster.wfarxbd.mongodb.net/stackqueue_2?retryWrites=true&w=majority';

let cachedConnectionPromise = null;
let isConnecting = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
const BASE_RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

const mongoOptions = {
  maxPoolSize: process.env.VERCEL ? 10 : 50,
  minPoolSize: process.env.VERCEL ? 1 : 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  autoIndex: false
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

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  cachedConnectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, mongoOptions);
      systemLogger.info(`[MongoDB] Connected successfully: ${conn.connection.host}`);

      if (!process.env.VERCEL) {
        try {
          const { deduplicateColleges } = require('../controllers/adminController');
          await deduplicateColleges();
        } catch (dedupErr) {
          systemLogger.warn(`[MongoDB College Deduplication Warning]: ${dedupErr.message}`);
        }
      }

      return conn.connection;
    } catch (error) {
      cachedConnectionPromise = null;
      systemLogger.error(`[MongoDB Connection Error]: ${error.message}`, {
        stack: error.stack
      });

      await captureError(error, {
        service: 'MongoDB Database Service',
        severity: 'CRITICAL',
        impact: 'MongoDB connection failed. Process is maintaining operation.'
      }).catch(() => {});

      if (!process.env.VERCEL) {
        scheduleReconnect();
      }
      throw error;
    }
  })();

  return cachedConnectionPromise;
};

module.exports = connectDB;
