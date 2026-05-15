'use strict';

const { checkConnection, getConnectionInfo, pingDB } = require('../config/database');
const { MESSAGES } = require('../config/constants');

/**
 * GET /api/health
 * Returns a comprehensive health snapshot used by load-balancers and monitoring.
 * The top-level envelope and data.server / data.database / data.application
 * structure is part of the public contract and must remain stable.
 */
async function getHealth(req, res, next) {
  try {
    const dbConnected = await checkConnection();
    const { responseTimeMs } = await pingDB();
    const connInfo = getConnectionInfo();

    const healthData = {
      status: dbConnected ? 'healthy' : 'degraded',
      server: {
        uptime: Math.floor(process.uptime()),
        uptimeHuman: formatUptime(process.uptime()),
        memoryUsage: formatMemory(process.memoryUsage()),
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: {
        status: connInfo.state,
        connected: dbConnected,
        name: connInfo.name || parseDbName(process.env.MONGODB_URI),
        host: connInfo.host || 'localhost',
        responseTime: `${responseTimeMs}ms`,
      },
      application: {
        name: process.env.APP_NAME || 'Notes App Backend',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = dbConnected ? 200 : 503;
    return res.status(statusCode).json({
      success: dbConnected,
      message: dbConnected ? MESSAGES.HEALTH_OK : 'Server is degraded — database unavailable',
      data: healthData,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Extract the database name from a MongoDB connection string.
 * Falls back to 'notes_app' when the URI is absent or unparseable.
 */
function parseDbName(uri) {
  if (!uri) return 'notes_app';
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'notes_app';
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function formatMemory(mem) {
  const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return {
    rss: mb(mem.rss),
    heapTotal: mb(mem.heapTotal),
    heapUsed: mb(mem.heapUsed),
    external: mb(mem.external),
  };
}

module.exports = { getHealth };
