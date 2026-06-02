'use strict';

const pino = require('pino');
const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure logs directory exists at startup
const resolvedLogDir = path.resolve(LOG_DIR);
if (!fs.existsSync(resolvedLogDir)) {
  fs.mkdirSync(resolvedLogDir, { recursive: true });
}

const errorLogPath = path.join(resolvedLogDir, 'error.log');
const combinedLogPath = path.join(resolvedLogDir, 'combined.log');

let logger;

if (NODE_ENV === 'development') {
  // Pretty-print to stdout + write plain JSON to log files via transport.targets.
  // pino does NOT allow `formatters` with `transport.targets`, so we omit it here —
  // pino-pretty already renders the level as a human-readable label in the console.
  logger = pino({
    level: LOG_LEVEL,
    base: { env: NODE_ENV, app: process.env.APP_NAME || 'notes-app-backend' },
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          level: LOG_LEVEL,
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
        {
          target: 'pino/file',
          level: LOG_LEVEL,
          options: { destination: combinedLogPath, mkdir: true },
        },
        {
          target: 'pino/file',
          level: 'error',
          options: { destination: errorLogPath, mkdir: true },
        },
      ],
    },
  });
} else {
  // Structured JSON logs to files for production/test.
  // pino.multistream uses synchronous pino.destination streams — compatible with formatters.
  logger = pino(
    {
      level: LOG_LEVEL,
      base: {
        env: NODE_ENV,
        app: process.env.APP_NAME || 'notes-app-backend',
        version: process.env.APP_VERSION || '1.0.0',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) { return { level: label }; },
      },
      redact: {
        paths: ['*.password', '*.token', '*.authorization', '*.secret', '*.apiKey'],
        censor: '[REDACTED]',
      },
    },
    pino.multistream([
      { stream: pino.destination({ dest: combinedLogPath, sync: true }), level: LOG_LEVEL },
      { stream: pino.destination({ dest: errorLogPath, sync: true }), level: 'error' },
    ])
  );
}

/**
 * Create a child logger with arbitrary context fields.
 * @param {Object} context - e.g. { action: 'login', userId: '...' }
 * @returns {import('pino').Logger}
 */
function createChildLogger(context = {}) {
  return logger.child(context);
}

/**
 * Create a request-scoped child logger with requestId + userId pre-bound.
 * @param {import('express').Request} req
 * @returns {import('pino').Logger}
 */
function createRequestLogger(req) {
  return logger.child({
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?._id ?? req.user?.id ?? undefined,
  });
}

module.exports = logger;
module.exports.createChildLogger = createChildLogger;
module.exports.createRequestLogger = createRequestLogger;
