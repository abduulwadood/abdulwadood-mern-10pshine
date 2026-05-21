'use strict';

// ── Valid User ───────────────────────────────────────────────────────────────

const validUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
};

// ── Invalid Users (negative testing) ─────────────────────────────────────────

const invalidUsers = {
  noEmail: { username: 'testuser', password: 'TestPass123!' },
  invalidEmail: { username: 'testuser', email: 'not-an-email', password: 'TestPass123!' },
  shortPassword: { username: 'testuser', email: 'test@example.com', password: '123' },
  shortUsername: { username: 'ab', email: 'test@example.com', password: 'TestPass123!' },
  invalidUsername: { username: 'test user!', email: 'test@example.com', password: 'TestPass123!' },
};

// ── Valid Note ───────────────────────────────────────────────────────────────

const validNote = {
  title: 'Test Note Title',
  content: 'This is the content of the test note.',
  tags: ['test', 'sample'],
  color: '#ffffff',
};

// ── Invalid Notes (negative testing) ─────────────────────────────────────────

const invalidNotes = {
  noTitle: { content: 'Content without title' },
  noContent: { title: 'Title without content' },
  longTitle: { title: 'a'.repeat(201), content: 'Content' },
  tooManyTags: { title: 'Title', content: 'Content', tags: Array(11).fill('tag') },
  invalidColor: { title: 'Title', content: 'Content', color: 'not-a-color' },
};

// ── MongoDB ObjectId samples ─────────────────────────────────────────────────

const validObjectId = '507f1f77bcf86cd799439011';
const invalidObjectId = 'not-a-valid-objectid';

// ── Module 3: Auth fixtures ───────────────────────────────────────────────────

const validRegistration = {
  username: 'authuser',
  email: 'authuser@example.com',
  password: 'TestPass123!',
  firstName: 'Auth',
  lastName: 'User',
};

const validLogin = {
  email: 'authuser@example.com',
  password: 'TestPass123!',
};

const invalidRegistrations = {
  missingEmail: { username: 'authuser', password: 'TestPass123!' },
  invalidEmail: { username: 'authuser', email: 'not-an-email', password: 'TestPass123!' },
  shortPassword: { username: 'authuser', email: 'authuser@example.com', password: '123' },
  shortUsername: { username: 'au', email: 'authuser@example.com', password: 'TestPass123!' },
  invalidUsername: { username: 'auth user!', email: 'authuser@example.com', password: 'TestPass123!' },
};

const validOTP = '123456';
const invalidOTP = '000000';
const expiredOTPDate = new Date(Date.now() - 11 * 60 * 1000); // 11 minutes ago

// ── Misc fixtures retained from Module 1 ─────────────────────────────────────

const mockEnvConfig = {
  PORT: '5000',
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://localhost:27017/notes_app',
  MONGODB_URI_TEST: 'mongodb://localhost:27017/notes_app_test',
  JWT_SECRET: 'test_secret_key_for_testing_only_32chars',
  JWT_EXPIRE: '1h',
  CORS_ORIGIN: 'http://localhost:3000',
};

const mockErrors = {
  validationError: {
    message: 'Validation failed',
    details: ['Email is required', 'Password is too short'],
  },
  authError: {
    message: 'Authentication required',
  },
};

module.exports = {
  validUser,
  invalidUsers,
  validNote,
  invalidNotes,
  validObjectId,
  invalidObjectId,
  mockEnvConfig,
  mockErrors,
  validRegistration,
  validLogin,
  invalidRegistrations,
  validOTP,
  invalidOTP,
  expiredOTPDate,
};
