'use strict';

const express = require('express');
const { body } = require('express-validator');
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
} = require('../controllers/authController');
const {
  authenticateToken,
  requireVerifiedEmail,
  rateLimitAuth,
  rateLimitOTP,
} = require('../middleware/authMiddleware');

const router = express.Router();

// ── Validation chains ────────────────────────────────────────────────────────

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
];

const otpValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number'),
];

const emailValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Validation error handler ─────────────────────────────────────────────────

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      errors.array().map((e) => e.msg).join(', '),
      HTTP_STATUS.BAD_REQUEST
    );
  }
  return next();
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.post('/register', rateLimitAuth, registerValidation, validate, register);
router.post('/verify-otp', rateLimitOTP, otpValidation, validate, verifyOTP);
router.post('/resend-otp', rateLimitOTP, emailValidation, validate, resendOTP);
router.post('/login', rateLimitAuth, loginValidation, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, requireVerifiedEmail, getMe);
router.patch('/me', authenticateToken, requireVerifiedEmail, updateMe);

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character'),
];
router.post('/change-password', authenticateToken, changePasswordValidation, validate, changePassword);

module.exports = router;
