'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwtUtils');
const { generateOTP, hashOTP } = require('../utils/otpUtils');
const otpUtils = require('../utils/otpUtils');
const emailService = require('../services/emailService');
const {
  HTTP_STATUS,
  AUTH_CONSTANTS,
  OTP_CONSTANTS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../config/logger');

// ── helpers ──────────────────────────────────────────────────────────────────

function setRefreshCookie(res, token) {
  res.cookie(AUTH_CONSTANTS.COOKIE_NAME, token, AUTH_CONSTANTS.COOKIE_OPTIONS);
}

function clearRefreshCookie(res) {
  res.clearCookie(AUTH_CONSTANTS.COOKIE_NAME, {
    httpOnly: true,
    secure: AUTH_CONSTANTS.COOKIE_OPTIONS.secure,
    sameSite: AUTH_CONSTANTS.COOKIE_OPTIONS.sameSite,
  });
}

async function issueTokens(res, user) {
  const payload = { id: user._id.toString(), username: user.username, email: user.email };
  const { accessToken, refreshToken } = generateTokenPair(payload);
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  await user.updateOne({ $set: { refreshToken: hashedRefresh, lastLoginAt: new Date() } });
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

// ── controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const msg = existing.email === email.toLowerCase()
        ? ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
        : ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
      return sendError(res, msg, HTTP_STATUS.CONFLICT);
    }

    const user = await User.create({ username, email, password, firstName, lastName });

    const otp = generateOTP();
    const hashed = hashOTP(otp);
    await user.generateOTP(hashed, OTP_CONSTANTS.PURPOSES.EMAIL_VERIFICATION);

    try {
      await emailService.sendOTPVerificationEmail(user, otp);
    } catch (emailErr) {
      logger.warn({ error: emailErr.message, userId: user._id }, 'OTP email failed at registration');
    }

    return sendSuccess(res, { userId: user._id }, SUCCESS_MESSAGES.REGISTERED, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 */
async function verifyOTP(req, res, next) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp.code');
    if (!user) return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

    if (user.isEmailVerified) {
      return sendError(res, 'Email is already verified.', HTTP_STATUS.CONFLICT);
    }

    const result = await user.verifyOTP(otp, otpUtils);
    if (!result.valid) {
      const msg = {
        max_attempts: ERROR_MESSAGES.OTP_MAX_ATTEMPTS,
        expired: ERROR_MESSAGES.OTP_EXPIRED,
        invalid: ERROR_MESSAGES.OTP_INVALID,
        no_otp: ERROR_MESSAGES.OTP_INVALID,
      }[result.reason] || ERROR_MESSAGES.OTP_INVALID;
      return sendError(res, msg, HTTP_STATUS.BAD_REQUEST);
    }

    await user.updateOne({ $set: { isEmailVerified: true } });
    user.isEmailVerified = true;

    try {
      await emailService.sendWelcomeEmail(user);
    } catch (emailErr) {
      logger.warn({ error: emailErr.message, userId: user._id }, 'Welcome email failed');
    }

    return sendSuccess(res, null, SUCCESS_MESSAGES.EMAIL_VERIFIED);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/resend-otp
 */
async function resendOTP(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    if (user.isEmailVerified) {
      return sendError(res, 'Email is already verified.', HTTP_STATUS.CONFLICT);
    }
    if (!user.canResendOTP()) {
      return sendError(res, ERROR_MESSAGES.OTP_RESEND_COOLDOWN, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    const otp = generateOTP();
    const hashed = hashOTP(otp);
    await user.generateOTP(hashed, OTP_CONSTANTS.PURPOSES.EMAIL_VERIFICATION);

    try {
      await emailService.sendOTPVerificationEmail(user, otp);
    } catch (emailErr) {
      logger.warn({ error: emailErr.message, userId: user._id }, 'OTP resend email failed');
      return sendError(res, ERROR_MESSAGES.EMAIL_SEND_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return sendSuccess(res, null, SUCCESS_MESSAGES.OTP_RESENT);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) return sendError(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

    if (user.isLocked) return sendError(res, ERROR_MESSAGES.ACCOUNT_LOCKED, HTTP_STATUS.UNAUTHORIZED);
    if (!user.isActive) return sendError(res, ERROR_MESSAGES.ACCOUNT_INACTIVE, HTTP_STATUS.FORBIDDEN);

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      await user.incrementLoginAttempts();
      return sendError(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.isEmailVerified) {
      return sendError(res, ERROR_MESSAGES.EMAIL_NOT_VERIFIED, HTTP_STATUS.FORBIDDEN);
    }

    await user.resetLoginAttempts();
    const accessToken = await issueTokens(res, user);

    return sendSuccess(res, { accessToken, user: user.toJSON() }, SUCCESS_MESSAGES.LOGGED_IN);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/refresh-token
 */
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies && req.cookies[AUTH_CONSTANTS.COOKIE_NAME];
    if (!token) return sendError(res, ERROR_MESSAGES.REFRESH_TOKEN_MISSING, HTTP_STATUS.UNAUTHORIZED);

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return sendError(res, ERROR_MESSAGES.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await User.findById(decoded.sub).select('+refreshToken');
    if (!user || !user.refreshToken) {
      return sendError(res, ERROR_MESSAGES.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    const tokenMatch = await bcrypt.compare(token, user.refreshToken);
    if (!tokenMatch) {
      return sendError(res, ERROR_MESSAGES.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    const accessToken = await issueTokens(res, user);
    return sendSuccess(res, { accessToken }, SUCCESS_MESSAGES.TOKEN_REFRESHED);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    if (req.user) {
      await req.user.updateOne({ $set: { refreshToken: null } });
    }
    clearRefreshCookie(res);
    return sendSuccess(res, null, SUCCESS_MESSAGES.LOGGED_OUT);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    return sendSuccess(res, { user: req.user.toJSON() }, SUCCESS_MESSAGES.PROFILE_FETCHED);
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, verifyOTP, resendOTP, login, refreshToken, logout, getMe };
