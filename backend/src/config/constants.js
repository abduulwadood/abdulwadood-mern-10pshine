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

// ── Module 2: MongoDB connection constants ──────────────────────────────────
const DB_CONSTANTS = {
  MAX_POOL_SIZE: 10,
  CONNECTION_TIMEOUT: 5000,
  SOCKET_TIMEOUT: 45000,
};

// ── Module 2: User model constants ──────────────────────────────────────────
const USER_CONSTANTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 50,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  SALT_ROUNDS: 12,
};

// ── Module 2: Note model constants ──────────────────────────────────────────
const NOTE_CONSTANTS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 50000,
  MAX_TAGS: 10,
  TAG_MAX_LENGTH: 30,
  DEFAULT_COLOR: '#ffffff',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// ── Module 2: Pagination constants ──────────────────────────────────────────
const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// ── Module 3: JWT constants ──────────────────────────────────────────────────
const JWT_CONSTANTS = {
  ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || '15m',
  REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  ALGORITHM: 'HS256',
  ISSUER: 'notes-app',
  AUDIENCE: 'notes-app-users',
};

// ── Module 3: OTP constants ──────────────────────────────────────────────────
const OTP_CONSTANTS = {
  LENGTH: 6,
  EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
  MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 3,
  RESEND_COOLDOWN_SECONDS: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 120,
  PURPOSES: {
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset',
  },
};

// ── Module 3: Auth constants ─────────────────────────────────────────────────
const AUTH_CONSTANTS = {
  COOKIE_NAME: 'refreshToken',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
  BEARER_PREFIX: 'Bearer ',
};

// ── Module 3: Rate limit constants ──────────────────────────────────────────
const RATE_LIMIT_CONSTANTS = {
  AUTH: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000,
    MAX: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 10,
  },
  OTP: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_OTP_WINDOW_MS, 10) || 15 * 60 * 1000,
    MAX: parseInt(process.env.RATE_LIMIT_OTP_MAX, 10) || 5,
  },
};

// ── Module 3: Success messages ───────────────────────────────────────────────
const SUCCESS_MESSAGES = {
  REGISTERED: 'Registration successful. Please check your email for the verification code.',
  EMAIL_VERIFIED: 'Email verified successfully.',
  OTP_RESENT: 'A new verification code has been sent to your email.',
  LOGGED_IN: 'Login successful.',
  TOKEN_REFRESHED: 'Access token refreshed.',
  LOGGED_OUT: 'Logout successful.',
  PROFILE_FETCHED: 'Profile retrieved successfully.',
};

// ── Module 3: Error messages ─────────────────────────────────────────────────
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account is temporarily locked. Please try again later.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  ACCOUNT_INACTIVE: 'Your account has been deactivated.',
  TOKEN_MISSING: 'Authentication token is required.',
  TOKEN_INVALID: 'Invalid or expired token.',
  TOKEN_EXPIRED: 'Token has expired.',
  REFRESH_TOKEN_MISSING: 'Refresh token is required.',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  USERNAME_ALREADY_EXISTS: 'This username is already taken.',
  OTP_INVALID: 'Invalid verification code.',
  OTP_EXPIRED: 'Verification code has expired.',
  OTP_MAX_ATTEMPTS: 'Maximum verification attempts exceeded. Please request a new code.',
  OTP_RESEND_COOLDOWN: 'Please wait before requesting another code.',
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again.',
  USER_NOT_FOUND: 'User not found.',
};

// ── Module 4: Notes CRUD constants ──────────────────────────────────────────
const NOTES_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: parseInt(process.env.NOTES_DEFAULT_PAGE_SIZE, 10) || 10,
  MAX_PAGE_SIZE: parseInt(process.env.NOTES_MAX_PAGE_SIZE, 10) || 100,
  DEFAULT_SORT: process.env.NOTES_DEFAULT_SORT || '-createdAt',
  MAX_TITLE_LENGTH: parseInt(process.env.NOTES_MAX_TITLE_LENGTH, 10) || 200,
  MIN_TITLE_LENGTH: 1,
  MAX_CONTENT_LENGTH: parseInt(process.env.NOTES_MAX_CONTENT_LENGTH, 10) || 50000,
  MAX_TAGS: parseInt(process.env.NOTES_MAX_TAGS, 10) || 10,
  MAX_TAG_LENGTH: 30,
  DEFAULT_COLOR: '#ffffff',
  VALID_COLORS: [
    '#ffffff', '#fef3c7', '#d1fae5', '#dbeafe',
    '#fce7f3', '#ede9fe', '#fee2e2', '#f3f4f6',
  ],
};

// ── Module 4: Voice notes constants ─────────────────────────────────────────
const VOICE_CONSTANTS = {
  SUPPORTED_LANGUAGES: {
    ENGLISH: 'en-US',
    URDU: 'ur-PK',
    AUTO: 'auto',
  },
  SUPPORTED_LANGUAGE_NAMES: {
    'en-US': 'English',
    'ur-PK': 'Urdu',
    'auto': 'Auto-detect',
  },
  INPUT_METHODS: {
    TYPED: 'typed',
    VOICE: 'voice',
    MIXED: 'mixed',
  },
  DEFAULT_LANGUAGE: process.env.VOICE_DEFAULT_LANGUAGE || 'en-US',
};

// ── Module 4: Note sort options ──────────────────────────────────────────────
const NOTE_SORT_OPTIONS = {
  NEWEST: '-createdAt',
  OLDEST: 'createdAt',
  RECENTLY_UPDATED: '-updatedAt',
  TITLE_ASC: 'title',
  TITLE_DESC: '-title',
  PINNED_FIRST: '-isPinned -createdAt',
};

// ── Module 4: Note filter options ────────────────────────────────────────────
const NOTE_FILTER_OPTIONS = {
  ALL: 'all',
  PINNED: 'pinned',
  ARCHIVED: 'archived',
  VOICE: 'voice',
  TYPED: 'typed',
  MIXED: 'mixed',
};

// ── Module 4: Notes success messages ────────────────────────────────────────
const NOTES_SUCCESS_MESSAGES = {
  NOTE_CREATED: 'Note created successfully.',
  NOTE_UPDATED: 'Note updated successfully.',
  NOTE_DELETED: 'Note deleted successfully.',
  NOTE_RESTORED: 'Note restored successfully.',
  NOTE_ARCHIVED: 'Note archived successfully.',
  NOTE_UNARCHIVED: 'Note unarchived successfully.',
  NOTE_PINNED: 'Note pinned successfully.',
  NOTE_UNPINNED: 'Note unpinned successfully.',
  NOTES_FETCHED: 'Notes retrieved successfully.',
  NOTE_FETCHED: 'Note retrieved successfully.',
  TAGS_ADDED: 'Tags added successfully.',
  TAGS_REMOVED: 'Tags removed successfully.',
  TAGS_FETCHED: 'Tags retrieved successfully.',
  STATS_FETCHED: 'Note statistics retrieved.',
  VOICE_NOTE_CREATED: 'Voice note created successfully.',
  VOICE_NOTE_UPDATED: 'Note updated with voice content successfully.',
  VOICE_NOTES_FETCHED: 'Voice notes retrieved successfully.',
  PERMANENT_DELETED: 'Note permanently deleted.',
};

// ── Module 4: Notes error messages ──────────────────────────────────────────
const NOTES_ERROR_MESSAGES = {
  NOTE_NOT_FOUND: 'Note not found.',
  NOTE_ACCESS_DENIED: 'You do not have permission to access this note.',
  INVALID_NOTE_ID: 'Invalid note ID format.',
  TITLE_REQUIRED: 'Note title is required.',
  CONTENT_REQUIRED: 'Note content is required.',
  TITLE_TOO_LONG: 'Title cannot exceed 200 characters.',
  CONTENT_TOO_LONG: 'Content cannot exceed 50000 characters.',
  TOO_MANY_TAGS: 'Cannot add more than 10 tags to a note.',
  TAG_TOO_LONG: 'Each tag cannot exceed 30 characters.',
  INVALID_COLOR: 'Invalid note color. Please use a valid hex color.',
  INVALID_LANGUAGE: 'Invalid voice language. Supported: en-US, ur-PK.',
  INVALID_INPUT_METHOD: 'Invalid input method. Use: typed, voice, or mixed.',
  NOTE_ALREADY_DELETED: 'This note has already been deleted.',
  VOICE_CONTENT_REQUIRED: 'Voice transcribed content is required.',
  LANGUAGE_NOT_SUPPORTED: 'The specified language is not supported for voice notes.',
  MUST_BE_DELETED_FIRST: 'Note must be soft-deleted before permanent deletion.',
  NO_UPDATE_FIELDS: 'At least one field is required for update.',
};

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
  DB_CONSTANTS,
  USER_CONSTANTS,
  NOTE_CONSTANTS,
  PAGINATION_CONSTANTS,
  JWT_CONSTANTS,
  OTP_CONSTANTS,
  AUTH_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  NOTES_CONSTANTS,
  VOICE_CONSTANTS,
  NOTE_SORT_OPTIONS,
  NOTE_FILTER_OPTIONS,
  NOTES_SUCCESS_MESSAGES,
  NOTES_ERROR_MESSAGES,
};
