'use strict';

const Joi = require('joi');
const mongoose = require('mongoose');
const { VALIDATION, USER_CONSTANTS, NOTE_CONSTANTS } = require('../config/constants');

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

// ---------------------------------------------------------------------------
// Module 2: model-layer validators — return { isValid, message } so callers
// outside the Joi flow get a consistent boolean + reason. The Joi validators
// above are unchanged (Module 1 contract: { valid, errors }).
// ---------------------------------------------------------------------------

/**
 * Validate that a value is a well-formed MongoDB ObjectId.
 * @param {*} id
 * @returns {boolean}
 */
function validateObjectId(id) {
  if (id === null || id === undefined) return false;
  return mongoose.Types.ObjectId.isValid(String(id));
}

/**
 * Validate a hex colour string (#rgb or #rrggbb).
 * @param {string} color
 * @returns {boolean}
 */
function validateHexColor(color) {
  if (typeof color !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
}

/**
 * Validate an array of note tags against count/length limits.
 * @param {string[]} tags
 * @returns {{ isValid: boolean, message: string }}
 */
function validateNoteTags(tags) {
  if (tags === undefined || tags === null) {
    return { isValid: true, message: '' };
  }
  if (!Array.isArray(tags)) {
    return { isValid: false, message: 'Tags must be an array' };
  }
  if (tags.length > NOTE_CONSTANTS.MAX_TAGS) {
    return {
      isValid: false,
      message: `A note may have at most ${NOTE_CONSTANTS.MAX_TAGS} tags`,
    };
  }
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { isValid: false, message: 'Each tag must be a string' };
    }
    if (tag.trim().length === 0) {
      return { isValid: false, message: 'Tags cannot be empty' };
    }
    if (tag.trim().length > NOTE_CONSTANTS.TAG_MAX_LENGTH) {
      return {
        isValid: false,
        message: `Each tag must not exceed ${NOTE_CONSTANTS.TAG_MAX_LENGTH} characters`,
      };
    }
  }
  return { isValid: true, message: '' };
}

/**
 * Assess password strength and enforce the minimum policy.
 * @param {string} password
 * @returns {{ isValid: boolean, message: string, strength: ('weak'|'medium'|'strong') }}
 */
function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { isValid: false, message: 'Password is required', strength: 'weak' };
  }

  const hasMinLength = password.length >= USER_CONSTANTS.PASSWORD_MIN_LENGTH;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passed = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strength = passed <= 2 ? 'weak' : passed <= 4 ? 'medium' : 'strong';

  if (!hasMinLength) {
    return {
      isValid: false,
      message: `Password must be at least ${USER_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
      strength,
    };
  }
  if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
    return {
      isValid: false,
      message:
        'Password must contain an uppercase letter, a lowercase letter, a number, and a special character',
      strength,
    };
  }

  return { isValid: true, message: '', strength };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateNoteTitle,
  validateNoteContent,
  validateRegistration,
  validateNote,
  validateObjectId,
  validateHexColor,
  validateNoteTags,
  validatePasswordStrength,
};
