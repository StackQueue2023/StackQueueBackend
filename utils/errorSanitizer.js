/**
 * Error Sanitizer Utility
 * Scrubs sensitive credentials, tokens, connection strings, and PII from error logs,
 * stack traces, request bodies, and headers before alerting or persistent logging.
 */

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'pwd',
  'secret',
  'jwt',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'cookie',
  'smtp_pass',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn'
];

/**
 * Redact sensitive patterns in raw text strings (e.g. stack traces, messages)
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  let sanitized = str;

  // Redact MongoDB connection strings with credentials: mongodb(+srv)://user:pass@host
  sanitized = sanitized.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/gi,
    '$1***:***@'
  );

  // Redact Bearer tokens & JWTs
  sanitized = sanitized.replace(
    /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
    'Bearer [REDACTED_TOKEN]'
  );
  sanitized = sanitized.replace(
    /eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g,
    '[REDACTED_JWT]'
  );

  // Redact potential 13-19 digit credit card numbers
  sanitized = sanitized.replace(
    /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    '[REDACTED_CARD]'
  );

  return sanitized;
}

/**
 * Deep-clean object or array by redacting sensitive keys and values
 */
function sanitizeObject(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') {
    return sanitizeString(obj);
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[CIRCULAR]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, seen));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sens => lowerKey.includes(sens));

    if (isSensitive) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeObject(value, seen);
    } else if (typeof value === 'string') {
      cleaned[key] = sanitizeString(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Parse stack trace to extract top-level application file, function, and line number
 */
function parseStackTrace(stack) {
  if (!stack || typeof stack !== 'string') {
    return { fileName: 'Unknown', functionName: 'Unknown', lineNumber: null, columnNumber: null };
  }

  const lines = stack.split('\n');
  // Find first stack line that references server code (not internal node_modules if possible)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    // Matches: at functionName (path/to/file.js:123:45) or at path/to/file.js:123:45
    const matchWithFunc = line.match(/^at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
    if (matchWithFunc) {
      const [, funcName, filePath, lineNum, colNum] = matchWithFunc;
      return {
        functionName: funcName,
        fileName: filePath.replace(/\\/g, '/').split('/').pop(),
        fullFilePath: filePath,
        lineNumber: parseInt(lineNum, 10),
        columnNumber: parseInt(colNum, 10)
      };
    }

    const matchDirect = line.match(/^at\s+(.+?):(\d+):(\d+)$/);
    if (matchDirect) {
      const [, filePath, lineNum, colNum] = matchDirect;
      return {
        functionName: 'anonymous',
        fileName: filePath.replace(/\\/g, '/').split('/').pop(),
        fullFilePath: filePath,
        lineNumber: parseInt(lineNum, 10),
        columnNumber: parseInt(colNum, 10)
      };
    }
  }

  return { fileName: 'Unknown', functionName: 'Unknown', lineNumber: null, columnNumber: null };
}

/**
 * Derive intelligent remediation suggestions based on error characteristics
 */
function generateRemediationHint(err, service) {
  const msg = (err?.message || '').toLowerCase();
  const name = err?.name || '';
  const code = err?.code || '';

  if (name.includes('Mongo') || msg.includes('mongodb') || msg.includes('topology') || msg.includes('buffering timed out')) {
    return 'Check MongoDB Atlas network access, IP whitelist (0.0.0.0/0 or server IP), cluster status, and MONGODB_URI in environment variables.';
  }
  if (code === 11000 || msg.includes('e11000') || msg.includes('duplicate key')) {
    return 'Unique constraint violated. Inspect duplicate field and ensure client sends unique identifiers.';
  }
  if (msg.includes('smtp') || msg.includes('nodemailer') || msg.includes('535') || msg.includes('authentication failed')) {
    return 'Verify SMTP credentials, Gmail App Password, and port 587/465 configuration in server/.env.';
  }
  if (name === 'JsonWebTokenError' || name === 'TokenExpiredError' || msg.includes('jwt')) {
    return 'JWT validation failed. Inspect JWT_SECRET in server/.env and verify client authorization header formatting.';
  }
  if (name === 'ValidationError' || name === 'CastError') {
    return 'Mongoose schema validation failed. Check request payload format against expected schema types.';
  }
  if (msg.includes('cannot read properties of undefined') || msg.includes('cannot read property')) {
    return 'Null/undefined reference error in application logic. Add optional chaining (?.) or defensive null-checks in controller.';
  }
  if (code === 'ENOENT' || msg.includes('no such file or directory')) {
    return 'Filesystem path missing. Verify target directory exists and server process has read/write permissions.';
  }
  if (code === 'ECONNREFUSED') {
    return 'Target service refused connection. Verify external host, database port, or microservice is online and accessible.';
  }

  return `Inspect runtime application logs and stack trace for ${service || 'Backend'}. Check service dependencies.`;
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  parseStackTrace,
  generateRemediationHint
};
