'use strict';

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Response Messages
const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  DB_CONNECTION_SUCCESS: 'Database connection established',
  DB_CONNECTION_FAILED: 'Database connection failed',
  SERVER_STARTED: 'Server started successfully',
  SERVER_STOPPED: 'Server stopped gracefully',
  HEALTH_OK: 'Server is healthy',
};

// Custom Error Types
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  AUTH: 'AuthError',
  NOT_FOUND: 'NotFoundError',
  DATABASE: 'DatabaseError',
  SERVER: 'ServerError',
  CONFLICT: 'ConflictError',
  RATE_LIMIT: 'RateLimitError',
};

// Timeout Values (milliseconds)
const TIMEOUTS = {
  REQUEST: 30000,
  DB_CONNECT: 10000,
  DB_QUERY: 15000,
  DB_RETRY_INTERVAL: 5000,
  DB_MAX_RETRIES: 5,
};

// Database Constants
const DB = {
  MAX_POOL: 10,
  MIN_POOL: 2,
  ACQUIRE_TIMEOUT: 30000,
  IDLE_TIMEOUT: 10000,
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Validation Rules
const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  NOTE_TITLE_MAX_LENGTH: 255,
  NOTE_CONTENT_MAX_LENGTH: 10000,
};

// Log Levels
const LOG_LEVELS = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
};

// Sensitive fields to mask in logs
const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'secret', 'apiKey', 'api_key'];

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  ERROR_TYPES,
  TIMEOUTS,
  DB,
  PAGINATION,
  VALIDATION,
  LOG_LEVELS,
  SENSITIVE_FIELDS,
};
