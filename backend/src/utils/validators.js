'use strict';

const Joi = require('joi');
const { VALIDATION } = require('../config/constants');

// ---------------------------------------------------------------------------
// Reusable Joi schemas
// ---------------------------------------------------------------------------

const emailSchema = Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required();

const passwordSchema = Joi.string()
  .min(VALIDATION.PASSWORD_MIN_LENGTH)
  .max(VALIDATION.PASSWORD_MAX_LENGTH)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    'string.min': `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
    'string.max': `Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`,
  });

const usernameSchema = Joi.string()
  .alphanum()
  .min(VALIDATION.USERNAME_MIN_LENGTH)
  .max(VALIDATION.USERNAME_MAX_LENGTH)
  .trim()
  .required()
  .messages({
    'string.alphanum': 'Username may only contain alphanumeric characters',
    'string.min': `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`,
    'string.max': `Username must not exceed ${VALIDATION.USERNAME_MAX_LENGTH} characters`,
  });

const noteTitleSchema = Joi.string()
  .max(VALIDATION.NOTE_TITLE_MAX_LENGTH)
  .trim()
  .required()
  .messages({
    'string.max': `Title must not exceed ${VALIDATION.NOTE_TITLE_MAX_LENGTH} characters`,
  });

const noteContentSchema = Joi.string()
  .max(VALIDATION.NOTE_CONTENT_MAX_LENGTH)
  .allow('')
  .optional()
  .messages({
    'string.max': `Content must not exceed ${VALIDATION.NOTE_CONTENT_MAX_LENGTH} characters`,
  });

// ---------------------------------------------------------------------------
// Validation helper — returns { valid, errors }
// ---------------------------------------------------------------------------

/**
 * Validate a value against a Joi schema.
 * @param {*}        value
 * @param {object}   schema - Joi schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(value, schema) {
  const { error } = schema.validate(value, { abortEarly: false });
  if (!error) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: error.details.map((d) => d.message),
  };
}

// ---------------------------------------------------------------------------
// Named validators
// ---------------------------------------------------------------------------

function validateEmail(email) {
  return validate(email, emailSchema);
}

function validatePassword(password) {
  return validate(password, passwordSchema);
}

function validateUsername(username) {
  return validate(username, usernameSchema);
}

function validateNoteTitle(title) {
  return validate(title, noteTitleSchema);
}

function validateNoteContent(content) {
  return validate(content, noteContentSchema);
}

/**
 * Validate a complete registration payload.
 * @param {{ email, password, username }} data
 */
function validateRegistration(data) {
  const schema = Joi.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
  });
  return validate(data, schema);
}

/**
 * Validate a complete note creation payload.
 * @param {{ title, content }} data
 */
function validateNote(data) {
  const schema = Joi.object({
    title: noteTitleSchema,
    content: noteContentSchema,
  });
  return validate(data, schema);
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateNoteTitle,
  validateNoteContent,
  validateRegistration,
  validateNote,
};
