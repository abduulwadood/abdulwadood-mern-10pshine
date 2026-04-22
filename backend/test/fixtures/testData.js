'use strict';

// ── Mock Users ───────────────────────────────────────────────────────────────

const validUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password1!',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const invalidUsers = {
  missingEmail: { username: 'testuser', password: 'Password1!' },
  invalidEmail: { username: 'testuser', email: 'not-an-email', password: 'Password1!' },
  weakPassword: { username: 'testuser', email: 'test@example.com', password: '123' },
  shortUsername: { username: 'ab', email: 'test@example.com', password: 'Password1!' },
};

// ── Mock Notes ───────────────────────────────────────────────────────────────

const validNote = {
  id: 1,
  title: 'Test Note Title',
  content: 'This is the note content for testing purposes.',
  userId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const invalidNotes = {
  missingTitle: { content: 'Content without title' },
  titleTooLong: { title: 'A'.repeat(256), content: 'Some content' },
  contentTooLong: { title: 'Valid Title', content: 'A'.repeat(10001) },
};

// ── Mock Configs ─────────────────────────────────────────────────────────────

const mockEnvConfig = {
  PORT: '5000',
  NODE_ENV: 'test',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'testuser',
  DB_PASSWORD: 'testpassword',
  DB_NAME: 'notes_test',
  JWT_SECRET: 'test_secret_key_for_testing_only_32chars',
  JWT_EXPIRE: '1h',
  CORS_ORIGIN: 'http://localhost:3000',
};

// ── Mock Error Objects ───────────────────────────────────────────────────────

const mockErrors = {
  validationError: {
    message: 'Validation failed',
    details: ['Email is required', 'Password is too short'],
  },
  dbError: {
    code: 'ER_NO_SUCH_TABLE',
    message: 'Table does not exist',
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
  mockEnvConfig,
  mockErrors,
};
