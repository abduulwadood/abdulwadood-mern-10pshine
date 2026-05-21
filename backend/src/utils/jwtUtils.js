'use strict';

const jwt = require('jsonwebtoken');
const { JWT_CONSTANTS, AUTH_CONSTANTS } = require('../config/constants');

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

/**
 * Sign an access token (short-lived, 15 min by default).
 * @param {{ id: string, username: string, email: string }} payload
 * @returns {string}
 */
function generateAccessToken(payload) {
  return jwt.sign(
    { sub: payload.id, username: payload.username, email: payload.email, type: 'access' },
    getAccessSecret(),
    {
      expiresIn: JWT_CONSTANTS.ACCESS_EXPIRE,
      algorithm: JWT_CONSTANTS.ALGORITHM,
      issuer: JWT_CONSTANTS.ISSUER,
      audience: JWT_CONSTANTS.AUDIENCE,
    }
  );
}

/**
 * Sign a refresh token (long-lived, 7 days by default).
 * @param {{ id: string }} payload
 * @returns {string}
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    { sub: payload.id, type: 'refresh' },
    getRefreshSecret(),
    {
      expiresIn: JWT_CONSTANTS.REFRESH_EXPIRE,
      algorithm: JWT_CONSTANTS.ALGORITHM,
      issuer: JWT_CONSTANTS.ISSUER,
      audience: JWT_CONSTANTS.AUDIENCE,
    }
  );
}

/**
 * Convenience: generate both tokens at once.
 * @param {{ id: string, username: string, email: string }} payload
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokenPair(payload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify an access token. Throws if invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret(), {
    algorithms: [JWT_CONSTANTS.ALGORITHM],
    issuer: JWT_CONSTANTS.ISSUER,
    audience: JWT_CONSTANTS.AUDIENCE,
  });
}

/**
 * Verify a refresh token. Throws if invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret(), {
    algorithms: [JWT_CONSTANTS.ALGORITHM],
    issuer: JWT_CONSTANTS.ISSUER,
    audience: JWT_CONSTANTS.AUDIENCE,
  });
}

/**
 * Pull the Bearer token from an Authorization header value.
 * @param {string} header  e.g. "Bearer eyJ..."
 * @returns {string|null}
 */
function extractTokenFromHeader(header) {
  if (!header || !header.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) return null;
  const token = header.slice(AUTH_CONSTANTS.BEARER_PREFIX.length).trim();
  return token || null;
}

/**
 * Decode a token without verifying the signature (useful for reading expiry on an already-failed verify).
 * @param {string} token
 * @returns {object|null}
 */
function decodeTokenWithoutVerification(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeTokenWithoutVerification,
};
