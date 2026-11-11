const AuditLog = require('../models/AuditLog');

async function logAction(userId, action, entityType, entityId, metadata = {}) {
  try {
    return await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      metadata
    });
  } catch (err) {
    console.error('[AuditLogger] Error writing audit log:', err.message);
    return null;
  }
}

module.exports = { logAction };
