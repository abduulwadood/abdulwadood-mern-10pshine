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

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServerError,
};
