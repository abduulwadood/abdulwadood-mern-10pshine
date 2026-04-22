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
 *  2. Joi ValidationError (thrown by route-level validation)
 *  3. MySQL / mysql2 errors
 *  4. JWT errors
 *  5. SyntaxError from body-parser (malformed JSON)
 *  6. Anything else → generic 500
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';

  // ----- Operational errors we threw intentionally -----
  if (err instanceof AppError) {
    const logPayload = { requestId, statusCode: err.statusCode, errorType: err.errorType, message: err.message };
    if (err.statusCode >= 500) {
      logger.error({ ...logPayload, stack: err.stack }, 'Operational server error');
    } else {
      logger.warn(logPayload, 'Operational client error');
    }

    const details = err instanceof ValidationError ? err.details : undefined;
    return sendError(res, err.message, err.statusCode, details);
  }

  // ----- Joi validation errors -----
  if (err.name === 'ValidationError' && err.isJoi) {
    const details = err.details.map((d) => d.message);
    logger.warn({ requestId, details }, 'Joi validation error');
    return sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, details);
  }

  // ----- mysql2 / MySQL errors -----
  if (err.code && (err.code.startsWith('ER_') || err.code === 'ECONNREFUSED')) {
    logger.error({ requestId, code: err.code, message: err.message, stack: err.stack }, 'Database error');
    return sendError(res, 'A database error occurred', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // ----- JWT errors -----
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn({ requestId, name: err.name }, 'JWT error');
    return sendError(res, 'Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
  }

  // ----- Malformed JSON body -----
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn({ requestId }, 'Malformed JSON in request body');
    return sendError(res, 'Malformed JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  // ----- Unknown / programming errors -----
  logger.error({ requestId, message: err.message, stack: err.stack }, 'Unexpected error');
  return sendError(res, 'An unexpected error occurred', HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

module.exports = errorHandler;
