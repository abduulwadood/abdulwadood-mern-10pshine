'use strict';

const { getTransporter } = require('../config/emailConfig');
const { generateOTPEmailTemplate } = require('../templates/emails/otpVerification');
const { generateWelcomeEmailTemplate } = require('../templates/emails/welcomeEmail');
const { generatePasswordResetEmailTemplate } = require('../templates/emails/passwordReset');
const { OTP_CONSTANTS } = require('../config/constants');
const logger = require('../config/logger');

const FROM = `"${process.env.EMAIL_FROM_NAME || 'Notes App'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`;

async function sendMail({ to, subject, html, text }) {
  const info = await getTransporter().sendMail({ from: FROM, to, subject, html, text });
  logger.debug({ messageId: info.messageId, to }, 'Email sent');
  return info;
}

/**
 * Send the OTP verification email to the user.
 * @param {{ email: string, firstName: string, username: string }} user
 * @param {string} otp  plaintext 6-digit code
 */
async function sendOTPVerificationEmail(user, otp) {
  const template = generateOTPEmailTemplate({
    firstName: user.firstName,
    username: user.username,
    otp,
    expiresInMinutes: OTP_CONSTANTS.EXPIRY_MINUTES,
  });
  return sendMail({ to: user.email, ...template });
}

/**
 * Send the welcome email after successful email verification.
 * @param {{ email: string, firstName: string, username: string }} user
 */
async function sendWelcomeEmail(user) {
  const loginUrl = process.env.SERVER_URL
    ? `${process.env.SERVER_URL}/login`
    : 'http://localhost:3000/login';
  const template = generateWelcomeEmailTemplate({
    firstName: user.firstName,
    username: user.username,
    loginUrl,
  });
  return sendMail({ to: user.email, ...template });
}

/**
 * Stub — password reset email (future module).
 * @param {{ email: string, firstName: string, username: string }} user
 * @param {string} resetToken
 */
async function sendPasswordResetEmail(user, resetToken) {
  const template = generatePasswordResetEmailTemplate({
    firstName: user.firstName,
    username: user.username,
    resetToken,
  });
  return sendMail({ to: user.email, ...template });
}

module.exports = { sendOTPVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail };
