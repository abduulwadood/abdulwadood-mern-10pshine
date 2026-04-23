'use strict';

const { checkConnection } = require('../config/database');
const { sendSuccess } = require('../utils/responseHandler');
const { MESSAGES } = require('../config/constants');

/**
 * GET /api/health
 * Returns a comprehensive health snapshot used by load-balancers and monitoring.
 */
async function getHealth(req, res, next) {
  try {
    const dbConnected = await checkConnection();

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
        connected: dbConnected,
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'notes_app',
        dialect: process.env.DB_DIALECT || 'mysql',
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
