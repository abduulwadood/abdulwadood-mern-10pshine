'use strict';

const { HTTP_STATUS, ERROR_TYPES } = require('../config/constants');

/**
 * Base application error — all custom errors extend this.
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorType = ERROR_TYPES.SERVER) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = true; // distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      errorType: this.errorType,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_TYPES.VALIDATION);
    this.details = details; // array of field-level validation messages
  }

  toJSON() {
    return { ...super.toJSON(), details: this.details };
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_TYPES.AUTH);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_TYPES.AUTH);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_TYPES.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_TYPES.CONFLICT);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_TYPES.DATABASE);
    // Do not expose the original DB error message to API consumers
    this.originalMessage = originalError ? originalError.message : null;
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_TYPES.SERVER);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', retryAfter = 60) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_TYPES.RATE_LIMIT);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return { ...super.toJSON(), retryAfter: this.retryAfter };
  }
}

class ExternalServiceError extends AppError {
  constructor(service = 'External Service', message = null) {
    super(
      message || `${service} is temporarily unavailable.`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_TYPES.SERVER
    );
    this.service = service;
  }
}

class InvalidRequestError extends AppError {
  constructor(message = 'Invalid request', details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_TYPES.VALIDATION);
    this.details = details;
  }

  toJSON() {
    return { ...super.toJSON(), details: this.details };
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServerError,
  RateLimitError,
  ExternalServiceError,
  InvalidRequestError,
};
