'use strict';

const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Send a standardised success response.
 *
 * @param {object} res        - Express response object
 * @param {*}      data       - Payload to return
 * @param {string} message    - Human-readable message
 * @param {number} statusCode - HTTP status code (default 200)
 */
function sendSuccess(res, data = null, message = MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send a standardised created (201) response.
 */
function sendCreated(res, data = null, message = MESSAGES.CREATED) {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * Send a standardised error response.
 *
 * @param {object} res        - Express response object
 * @param {string} message    - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {*}      details    - Optional extra details (e.g. validation errors)
 */
function sendError(res, message = MESSAGES.INTERNAL_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
  const body = {
    success: false,
    message,
    data: null,
    error: {
      code: statusCode,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(body);
}

/**
 * Send a standardised no-content (204) response.
 */
function sendNoContent(res) {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

module.exports = { sendSuccess, sendCreated, sendError, sendNoContent };
