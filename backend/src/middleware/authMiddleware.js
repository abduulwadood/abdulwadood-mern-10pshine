'use strict';

const rateLimit = require('express-rate-limit');
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const { User } = require('../models');
const { HTTP_STATUS, AUTH_CONSTANTS, RATE_LIMIT_CONSTANTS, ERROR_MESSAGES } = require('../config/constants');
const { sendError } = require('../utils/responseHandler');
const logger = require('../config/logger');

/**
 * Require a valid Bearer access token.
 * Attaches `req.user` (plain object) on success.
 */
async function authenticateToken(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return sendError(res, ERROR_MESSAGES.TOKEN_MISSING, HTTP_STATUS.UNAUTHORIZED);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? ERROR_MESSAGES.TOKEN_EXPIRED
        : ERROR_MESSAGES.TOKEN_INVALID;
      return sendError(res, msg, HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await User.findById(decoded.sub).select('-password -refreshToken');
    if (!user) return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
    if (!user.isActive) return sendError(res, ERROR_MESSAGES.ACCOUNT_INACTIVE, HTTP_STATUS.FORBIDDEN);

    req.user = user;
    return next();
  } catch (err) {
    logger.error({ err }, 'authenticateToken unexpected error');
    return next(err);
  }
}

/**
 * Like authenticateToken but non-blocking: attaches req.user if token is valid, otherwise continues.
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) return next();
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('-password -refreshToken');
      if (user && user.isActive) req.user = user;
    } catch {
      // silently ignore invalid tokens
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Gate routes that require a verified email.
 * Must be used after authenticateToken.
 */
function requireVerifiedEmail(req, res, next) {
  if (!req.user) return sendError(res, ERROR_MESSAGES.TOKEN_MISSING, HTTP_STATUS.UNAUTHORIZED);
  if (!req.user.isEmailVerified) {
    return sendError(res, ERROR_MESSAGES.EMAIL_NOT_VERIFIED, HTTP_STATUS.FORBIDDEN);
  }
  return next();
}

/**
 * Rate limiter for auth endpoints (login, register, refresh, logout).
 */
const rateLimitAuth = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.AUTH.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.AUTH.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return sendError(
      res,
      'Too many requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

/**
 * Rate limiter for OTP endpoints (verify, resend).
 */
const rateLimitOTP = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.OTP.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.OTP.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return sendError(
      res,
      'Too many OTP requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

module.exports = { authenticateToken, optionalAuth, requireVerifiedEmail, rateLimitAuth, rateLimitOTP };
