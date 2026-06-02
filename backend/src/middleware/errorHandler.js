'use strict';

const logger = require('../config/logger');
const { AppError, ValidationError } = require('../utils/customErrors');
const { sendError } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Global error-handling middleware (must have 4 parameters so Express recognises it).
 *
 * Order of handling:
 *  1. Our own AppError subclasses (operational errors)
 *  2. Mongoose ValidationError (schema-level failures)
 *  3. MongoDB duplicate key (code 11000)
 *  4. Mongoose CastError (invalid ObjectId)
 *  5. JWT errors
 *  6. SyntaxError from body-parser (malformed JSON)
 *  7. Anything else → generic 500
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  const log = req.logger || logger;

  // ----- Operational errors we threw intentionally -----
  if (err instanceof AppError) {
    const logPayload = {
      requestId,
      statusCode: err.statusCode,
      errorType: err.errorType,
      message: err.message,
    };
    if (err.statusCode >= 500) {
      log.error({ ...logPayload, stack: err.stack }, 'Operational server error');
    } else {
      log.warn(logPayload, 'Operational client error');
    }

    const details = err instanceof ValidationError ? err.details : undefined;
    return sendError(res, err.message, err.statusCode, details);
  }

  // ----- Mongoose model validation error -----
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    log.warn({ requestId, fields: Object.keys(err.errors) }, 'Mongoose validation error');
    return sendError(
      res,
      messages.join(', '),
      HTTP_STATUS.BAD_REQUEST,
      messages
    );
  }

  // ----- MongoDB duplicate key error -----
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : undefined;
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    log.warn({ requestId, field, value }, 'Duplicate key error');
    return sendError(res, message, HTTP_STATUS.CONFLICT);
  }

  // ----- Mongoose CastError (invalid ObjectId or type coercion) -----
  if (err.name === 'CastError') {
    const message = `Invalid value for field '${err.path}'.`;
    log.warn({ requestId, path: err.path, kind: err.kind }, 'Mongoose cast error');
    return sendError(res, message, HTTP_STATUS.BAD_REQUEST);
  }

  // ----- JWT errors -----
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const message = err.name === 'TokenExpiredError'
      ? 'Token has expired.'
      : 'Invalid or expired token.';
    log.warn({ requestId, name: err.name }, 'JWT error');
    return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  // ----- Malformed JSON body -----
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    log.warn({ requestId }, 'Malformed JSON in request body');
    return sendError(res, 'Malformed JSON in request body.', HTTP_STATUS.BAD_REQUEST);
  }

  // ----- Unknown / programming errors -----
  log.error({ requestId, message: err.message, stack: err.stack }, 'Unexpected error');

  const isDev = process.env.NODE_ENV === 'development';
  return sendError(
    res,
    isDev ? err.message : 'An unexpected error occurred.',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isDev ? err.stack : undefined
  );
}

/**
 * 404 handler — mount before errorHandler so unknown routes get a clean response.
 */
function notFoundHandler(req, res) {
  return sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND
  );
}

module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
