'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';

const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeTokenWithoutVerification,
} = require('../../src/utils/jwtUtils');

const samplePayload = { id: '507f1f77bcf86cd799439011', username: 'testuser', email: 'test@example.com' };

describe('JWT Utilities', () => {
  // ── generateAccessToken ───────────────────────────────────────────────────
  describe('generateAccessToken', () => {
    it('returns a non-empty string', () => {
      expect(generateAccessToken(samplePayload)).to.be.a('string').and.not.empty;
    });

    it('contains the correct sub and username claims', () => {
      const token = generateAccessToken(samplePayload);
      const decoded = jwt.decode(token);
      expect(decoded.sub).to.equal(samplePayload.id);
      expect(decoded.username).to.equal(samplePayload.username);
      expect(decoded.type).to.equal('access');
    });
  });

  // ── generateRefreshToken ─────────────────────────────────────────────────
  describe('generateRefreshToken', () => {
    it('returns a non-empty string', () => {
      expect(generateRefreshToken(samplePayload)).to.be.a('string').and.not.empty;
    });

    it('has type=refresh in the payload', () => {
      const decoded = jwt.decode(generateRefreshToken(samplePayload));
      expect(decoded.type).to.equal('refresh');
    });
  });

  // ── generateTokenPair ────────────────────────────────────────────────────
  describe('generateTokenPair', () => {
    it('returns both accessToken and refreshToken', () => {
      const pair = generateTokenPair(samplePayload);
      expect(pair).to.have.all.keys('accessToken', 'refreshToken');
      expect(pair.accessToken).to.be.a('string').and.not.empty;
      expect(pair.refreshToken).to.be.a('string').and.not.empty;
    });

    it('access and refresh tokens are different', () => {
      const { accessToken, refreshToken } = generateTokenPair(samplePayload);
      expect(accessToken).to.not.equal(refreshToken);
    });
  });

  // ── verifyAccessToken ────────────────────────────────────────────────────
  describe('verifyAccessToken', () => {
    it('successfully verifies a valid access token', () => {
      const token = generateAccessToken(samplePayload);
      const decoded = verifyAccessToken(token);
      expect(decoded.sub).to.equal(samplePayload.id);
    });

    it('throws JsonWebTokenError for a tampered token', () => {
      const token = generateAccessToken(samplePayload) + 'tampered';
      expect(() => verifyAccessToken(token)).to.throw();
    });

    it('throws for a refresh token passed to verifyAccessToken', () => {
      const refreshToken = generateRefreshToken(samplePayload);
      // refresh token is signed with a different secret — should throw
      expect(() => verifyAccessToken(refreshToken)).to.throw();
    });
  });

  // ── verifyRefreshToken ───────────────────────────────────────────────────
  describe('verifyRefreshToken', () => {
    it('successfully verifies a valid refresh token', () => {
      const token = generateRefreshToken(samplePayload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.sub).to.equal(samplePayload.id);
    });

    it('throws for a tampered refresh token', () => {
      expect(() => verifyRefreshToken('bad.token.here')).to.throw();
    });
  });

  // ── extractTokenFromHeader ───────────────────────────────────────────────
  describe('extractTokenFromHeader', () => {
    it('extracts the token from a valid Bearer header', () => {
      const token = generateAccessToken(samplePayload);
      expect(extractTokenFromHeader(`Bearer ${token}`)).to.equal(token);
    });

    it('returns null for a missing header', () => {
      expect(extractTokenFromHeader(undefined)).to.be.null;
    });

    it('returns null when the prefix is wrong', () => {
      expect(extractTokenFromHeader('Token abc123')).to.be.null;
    });

    it('returns null for an empty string after prefix', () => {
      expect(extractTokenFromHeader('Bearer ')).to.be.null;
    });
  });

  // ── decodeTokenWithoutVerification ───────────────────────────────────────
  describe('decodeTokenWithoutVerification', () => {
    it('decodes a valid token without verifying signature', () => {
      const token = generateAccessToken(samplePayload);
      const decoded = decodeTokenWithoutVerification(token);
      expect(decoded).to.exist;
      expect(decoded.sub).to.equal(samplePayload.id);
    });

    it('returns null for a completely invalid string', () => {
      expect(decodeTokenWithoutVerification('not-a-jwt')).to.be.null;
    });
  });
});
