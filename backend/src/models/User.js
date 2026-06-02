'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const logger = require('../config/logger');
const { USER_CONSTANTS, OTP_CONSTANTS } = require('../config/constants');

const { Schema } = mongoose;

/**
 * User schema.
 *
 * Security notes:
 *  - `password` and `refreshToken` use `select: false` so they are never
 *    returned by default queries.
 *  - The JSON transform strips every sensitive / internal field so a User
 *    document is always safe to send in an API response.
 */
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [
        USER_CONSTANTS.USERNAME_MIN_LENGTH,
        `Username must be at least ${USER_CONSTANTS.USERNAME_MIN_LENGTH} characters`,
      ],
      maxlength: [
        USER_CONSTANTS.USERNAME_MAX_LENGTH,
        `Username must not exceed ${USER_CONSTANTS.USERNAME_MAX_LENGTH} characters`,
      ],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [
        USER_CONSTANTS.EMAIL_MAX_LENGTH,
        `Email must not exceed ${USER_CONSTANTS.EMAIL_MAX_LENGTH} characters`,
      ],
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Please provide a valid email address',
      },
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [
        USER_CONSTANTS.PASSWORD_MIN_LENGTH,
        `Password must be at least ${USER_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
      ],
      maxlength: [
        USER_CONSTANTS.PASSWORD_MAX_LENGTH,
        `Password must not exceed ${USER_CONSTANTS.PASSWORD_MAX_LENGTH} characters`,
      ],
      select: false,
    },

    firstName: {
      type: String,
      trim: true,
      maxlength: [USER_CONSTANTS.NAME_MAX_LENGTH, 'First name is too long'],
      default: '',
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: [USER_CONSTANTS.NAME_MAX_LENGTH, 'Last name is too long'],
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    otp: {
      code: {
        type: String,
        select: false,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      lastSentAt: {
        type: Date,
        default: null,
      },
      purpose: {
        type: String,
        enum: [...Object.values(OTP_CONSTANTS.PURPOSES), null],
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        if (ret.otp) delete ret.otp.code;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// `email` and `username` already get a unique index from the field definition.
userSchema.index({ isActive: 1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────

/**
 * Full name = firstName + lastName, trimmed. Empty string when neither is set.
 */
userSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

/**
 * True while the account is locked (lockUntil is in the future).
 */
userSchema.virtual('isLocked').get(function getIsLocked() {
  if (!this.lockUntil) return false;
  const until = this.lockUntil instanceof Date ? this.lockUntil.getTime() : this.lockUntil;
  return until > Date.now();
});

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Hash the password before persisting, but only when it changed.
 */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, USER_CONSTANTS.SALT_ROUNDS);
    logger.debug({ userId: this._id }, 'User password hashed before save');
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Audit log on create / update — never logs sensitive fields.
 */
userSchema.post('save', function logSaved(doc) {
  logger.debug(
    { userId: doc._id, username: doc.username, email: doc.email },
    'User document saved'
  );
});

// ── Instance methods ─────────────────────────────────────────────────────────

/**
 * Compare a plaintext candidate against the stored hash.
 * The document must have been loaded with the password field selected.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) {
    throw new Error('Password field was not selected on this document');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Register a failed login. Locks the account once the attempt ceiling is hit.
 * Uses an atomic update so it works without the password field selected.
 * @returns {Promise<this>}
 */
userSchema.methods.incrementLoginAttempts = async function incrementLoginAttempts() {
  // A previous lock has expired — start a fresh count.
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    await this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
    this.loginAttempts = 1;
    this.lockUntil = null;
    return this;
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const willReachLimit = this.loginAttempts + 1 >= USER_CONSTANTS.MAX_LOGIN_ATTEMPTS;

  if (willReachLimit && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + USER_CONSTANTS.LOCK_TIME) };
    logger.warn(
      { userId: this._id, email: this.email, attempts: this.loginAttempts + 1 },
      'Account locked after too many failed login attempts'
    );
  } else {
    logger.warn(
      { userId: this._id, attempts: this.loginAttempts + 1 },
      'Failed login attempt recorded'
    );
  }

  await this.updateOne(updates);
  this.loginAttempts += 1;
  if (updates.$set) this.lockUntil = updates.$set.lockUntil;
  return this;
};

/**
 * Clear failed-login state after a successful authentication.
 * @returns {Promise<this>}
 */
userSchema.methods.resetLoginAttempts = async function resetLoginAttempts() {
  await this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
  this.loginAttempts = 0;
  this.lockUntil = null;
  return this;
};

/**
 * Store a hashed OTP code against this user document.
 * @param {string} hashedCode  SHA-256 hex hash of the plaintext OTP
 * @param {string} purpose     One of OTP_CONSTANTS.PURPOSES values
 * @returns {Promise<this>}
 */
userSchema.methods.generateOTP = async function generateOTP(hashedCode, purpose) {
  const expiresAt = new Date(Date.now() + OTP_CONSTANTS.EXPIRY_MINUTES * 60 * 1000);
  await this.updateOne({
    $set: {
      'otp.code': hashedCode,
      'otp.expiresAt': expiresAt,
      'otp.attempts': 0,
      'otp.lastSentAt': new Date(),
      'otp.purpose': purpose,
    },
  });
  this.otp = { code: hashedCode, expiresAt, attempts: 0, lastSentAt: new Date(), purpose };
  return this;
};

/**
 * Verify a plaintext OTP. Increments attempts on failure and clears on success.
 * Caller must have loaded the document with `+otp.code` selected.
 * @param {string} plainOTP  The raw 6-digit code from the user
 * @param {{ compareOTP: Function, isOTPExpired: Function }} otpUtils
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
userSchema.methods.verifyOTP = async function verifyOTP(plainOTP, otpUtils) {
  if (!this.otp || !this.otp.code) return { valid: false, reason: 'no_otp' };
  if (this.otp.attempts >= OTP_CONSTANTS.MAX_ATTEMPTS) return { valid: false, reason: 'max_attempts' };
  if (otpUtils.isOTPExpired(this.otp.expiresAt)) return { valid: false, reason: 'expired' };

  const match = otpUtils.compareOTP(plainOTP, this.otp.code);
  if (!match) {
    await this.updateOne({ $inc: { 'otp.attempts': 1 } });
    this.otp.attempts += 1;
    return { valid: false, reason: 'invalid' };
  }

  await this.clearOTP();
  return { valid: true };
};

/**
 * Returns true only when the resend cooldown has elapsed.
 * @returns {boolean}
 */
userSchema.methods.canResendOTP = function canResendOTP() {
  if (!this.otp || !this.otp.lastSentAt) return true;
  const elapsed = (Date.now() - this.otp.lastSentAt.getTime()) / 1000;
  return elapsed >= OTP_CONSTANTS.RESEND_COOLDOWN_SECONDS;
};

/**
 * Wipe the OTP subdocument (called after successful verification).
 * @returns {Promise<this>}
 */
userSchema.methods.clearOTP = async function clearOTP() {
  await this.updateOne({
    $set: {
      'otp.code': null,
      'otp.expiresAt': null,
      'otp.attempts': 0,
      'otp.lastSentAt': null,
      'otp.purpose': null,
    },
  });
  this.otp = { code: null, expiresAt: null, attempts: 0, lastSentAt: null, purpose: null };
  return this;
};

// ── Static methods ───────────────────────────────────────────────────────────

/**
 * Find a user by email, including the password field (for authentication).
 * @param {string} email
 * @returns {Promise<import('mongoose').Document|null>}
 */
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
};

/**
 * Find a user by username.
 * @param {string} username
 * @returns {Promise<import('mongoose').Document|null>}
 */
userSchema.statics.findByUsername = function findByUsername(username) {
  return this.findOne({ username: String(username).toLowerCase().trim() });
};

/**
 * All active (non soft-deleted) users.
 * @returns {Promise<Array>}
 */
userSchema.statics.findActiveUsers = function findActiveUsers() {
  return this.find({ isActive: true });
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
