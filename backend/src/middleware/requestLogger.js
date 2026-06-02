'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { createRequestLogger } = require('../config/logger');
const { SENSITIVE_FIELDS } = require('../config/constants');

/**
 * Recursively mask sensitive keys in an object so they are never logged.
 */
function maskSensitiveFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce((acc, key) => {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      acc[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      acc[key] = maskSensitiveFields(obj[key]);
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

/**
 * Express middleware that:
 *  1. Attaches a unique request ID to req and res headers.
 *  2. Logs the incoming request (method, url, ip, safe headers, safe body).
 *  3. Logs the outgoing response (status, duration, size) when it finishes.
 */
function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Attach a request-scoped child logger so controllers can use req.logger
  // for automatic requestId correlation without extra boilerplate.
  req.logger = createRequestLogger(req);

  const startTime = Date.now();

  // Build a loggable version of headers (drop Authorization value)
  const safeHeaders = maskSensitiveFields({ ...req.headers });

  logger.info(
    {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      headers: safeHeaders,
      body: maskSensitiveFields(req.body),
    },
    'Incoming request'
  );

  // Capture response finish to log outcome
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        contentLength: res.getHeader('content-length') || 0,
      },
      'Request completed'
    );
  });

  next();
}

module.exports = requestLogger;
module.exports.maskSensitiveFields = maskSensitiveFields;
