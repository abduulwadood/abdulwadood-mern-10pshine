'use strict';

const crypto = require('crypto');
const { OTP_CONSTANTS } = require('../config/constants');

/**
 * Generate a cryptographically random N-digit OTP string.
 * @param {number} [length]
 * @returns {string}  zero-padded to `length` digits
 */
function generateOTP(length = OTP_CONSTANTS.LENGTH) {
  const max = 10 ** length;
  const code = crypto.randomInt(0, max);
  return String(code).padStart(length, '0');
}

/**
 * SHA-256 hash of the plaintext OTP (stored in DB instead of plaintext).
 * @param {string} otp
 * @returns {string} hex digest
 */
function hashOTP(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Constant-time comparison between a plaintext OTP and its stored hash.
 * @param {string} plainOTP
 * @param {string} storedHash  hex SHA-256 digest
 * @returns {boolean}
 */
function compareOTP(plainOTP, storedHash) {
  const candidateHash = hashOTP(plainOTP);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Returns true if the OTP expiry date is in the past (or null).
 * @param {Date|null} expiresAt
 * @returns {boolean}
 */
function isOTPExpired(expiresAt) {
  if (!expiresAt) return true;
  return Date.now() > new Date(expiresAt).getTime();
}

/**
 * Compute an expiry Date from now.
 * @param {number} [minutes]
 * @returns {Date}
 */
function getOTPExpiryDate(minutes = OTP_CONSTANTS.EXPIRY_MINUTES) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Format a raw OTP string with a hyphen in the middle for display (e.g. "123-456").
 * @param {string} otp
 * @returns {string}
 */
function formatOTPForDisplay(otp) {
  const s = String(otp);
  const mid = Math.floor(s.length / 2);
  return `${s.slice(0, mid)}-${s.slice(mid)}`;
}

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  isOTPExpired,
  getOTPExpiryDate,
  formatOTPForDisplay,
};
