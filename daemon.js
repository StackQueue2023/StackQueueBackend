/**
 * STACK QUEUE — Permanent Backend Watchdog Supervisor
 * 
 * Runs the backend server continuously, automatically restarting it if any unexpected
 * crash or fatal error occurs, with exponential backoff and circuit-breaker protection
 * against infinite rapid crash loops.
 * 
 * Stops ONLY when manually stopped via SIGINT (Ctrl+C) or SIGTERM.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVER_SCRIPT = path.join(__dirname, 'server.js');
const LOGS_DIR = path.join(__dirname, 'logs');
const DAEMON_LOG = path.join(LOGS_DIR, 'daemon.log');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function daemonLog(message, isError = false) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [Watchdog] ${message}`;
  if (isError) {
    console.error(line);
  } else {
    console.log(line);
  }
  try {
    fs.appendFileSync(DAEMON_LOG, line + '\n', 'utf8');
  } catch (_) {}
}

let child = null;
let isManualStop = false;
let restartCount = 0;
const crashTimestamps = [];
const CRASH_WINDOW_MS = 60000; // 1 minute
const MAX_CRASHES_IN_WINDOW = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000; // 30s cooldown if rapid crash threshold hit

function startChildServer() {
  if (isManualStop) return;

  daemonLog(`Starting backend process (Attempt #${restartCount + 1})...`);

  child = spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      SUPERVISED_BY_DAEMON: 'true',
      DAEMON_RESTART_COUNT: String(restartCount)
    }
  });

  const currentChild = child;
  const startTime = Date.now();

  currentChild.on('error', (err) => {
    daemonLog(`Failed to spawn child process: ${err.message}`, true);
  });

  currentChild.on('exit', (code, signal) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    daemonLog(`Backend process exited with code ${code}, signal ${signal} (Uptime: ${uptimeSeconds}s)`);

    if (isManualStop) {
      daemonLog('Manual stop recognized. Daemon exiting cleanly with code 0.');
      process.exit(0);
      return;
    }

    // Process crashed or terminated unexpectedly
    restartCount++;
    const now = Date.now();
    crashTimestamps.push(now);

    // Keep only crashes within the moving window
    const recentCrashes = crashTimestamps.filter(t => now - t <= CRASH_WINDOW_MS);

    if (recentCrashes.length >= MAX_CRASHES_IN_WINDOW) {
      daemonLog(
        `[CRITICAL ALERT] Rapid crash loop detected (${recentCrashes.length} crashes in ${CRASH_WINDOW_MS / 1000}s). Cooling down for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s before next restart...`,
        true
      );
      // Dispatch alert to admin
      try {
        const { captureError } = require('./services/errorAlertService');
        captureError(new Error(`Backend rapid crash loop detected: ${recentCrashes.length} crashes in 60s`), {
          service: 'Backend Watchdog Daemon',
          severity: 'CRITICAL',
          impact: `Server repeatedly crashing. Automatic cooldown triggered. Restart #${restartCount}.`
        }).catch(() => {});
      } catch (_) {}

      setTimeout(() => {
        startChildServer();
      }, CIRCUIT_BREAKER_COOLDOWN_MS);
      return;
    }

    // Normal auto-restart with exponential backoff (1s -> 2s -> 4s up to 10s max)
    const backoffDelay = Math.min(1000 * Math.pow(1.5, Math.min(restartCount, 6)), 10000);
    daemonLog(`Auto-recovering backend in ${Math.round(backoffDelay / 1000)}s...`);

    setTimeout(() => {
      startChildServer();
    }, backoffDelay);
  });
}

// Handle manual stop signals
function handleManualStop(signal) {
  if (isManualStop) return;
  isManualStop = true;
  daemonLog(`Manual stop received (${signal}). Shutting down gracefully...`);

  if (child && !child.killed) {
    child.kill('SIGINT');

    // Force terminate child if still hanging after 5s
    setTimeout(() => {
      if (child && !child.killed) {
        daemonLog('Child hung during shutdown. Forcing SIGKILL...');
        try { child.kill('SIGKILL'); } catch (_) {}
      }
      process.exit(0);
    }, 5000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => handleManualStop('SIGINT'));
process.on('SIGTERM', () => handleManualStop('SIGTERM'));

daemonLog('====================================================');
daemonLog('STACK QUEUE Watchdog Supervisor Started');
daemonLog('Continuous operation enabled. Stops ONLY on manual stop.');
daemonLog('====================================================');

startChildServer();
