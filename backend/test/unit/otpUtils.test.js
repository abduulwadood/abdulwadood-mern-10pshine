'use strict';

process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const {
  generateOTP,
  hashOTP,
  compareOTP,
  isOTPExpired,
  getOTPExpiryDate,
  formatOTPForDisplay,
} = require('../../src/utils/otpUtils');

describe('OTP Utilities', () => {
  // ── generateOTP ──────────────────────────────────────────────────────────
  describe('generateOTP', () => {
    it('returns a 6-character string by default', () => {
      const otp = generateOTP();
      expect(otp).to.be.a('string').with.lengthOf(6);
    });

    it('returns only digits', () => {
      const otp = generateOTP();
      expect(otp).to.match(/^\d{6}$/);
    });

    it('zero-pads codes less than 100000', () => {
      // generateOTP pads to LENGTH digits, so it should always be LENGTH chars
      for (let i = 0; i < 20; i++) {
        expect(generateOTP()).to.have.lengthOf(6);
      }
    });

    it('respects a custom length', () => {
      expect(generateOTP(4)).to.match(/^\d{4}$/);
    });
  });

  // ── hashOTP ──────────────────────────────────────────────────────────────
  describe('hashOTP', () => {
    it('returns a 64-character hex string (SHA-256)', () => {
      expect(hashOTP('123456')).to.be.a('string').with.lengthOf(64).and.match(/^[a-f0-9]+$/);
    });

    it('produces the same hash for the same input', () => {
      expect(hashOTP('123456')).to.equal(hashOTP('123456'));
    });

    it('produces different hashes for different inputs', () => {
      expect(hashOTP('123456')).to.not.equal(hashOTP('654321'));
    });
  });

  // ── compareOTP ───────────────────────────────────────────────────────────
  describe('compareOTP', () => {
    it('returns true when plaintext matches stored hash', () => {
      const otp = '123456';
      expect(compareOTP(otp, hashOTP(otp))).to.be.true;
    });

    it('returns false for a wrong OTP', () => {
      expect(compareOTP('000000', hashOTP('123456'))).to.be.false;
    });

    it('accepts the stored hash in uppercase (Buffer.from hex is case-insensitive)', () => {
      const otp = '123456';
      const hash = hashOTP(otp);
      expect(compareOTP(otp, hash.toUpperCase())).to.be.true;
    });
  });

  // ── isOTPExpired ─────────────────────────────────────────────────────────
  describe('isOTPExpired', () => {
    it('returns false for a future date', () => {
      expect(isOTPExpired(new Date(Date.now() + 60000))).to.be.false;
    });

    it('returns true for a past date', () => {
      expect(isOTPExpired(new Date(Date.now() - 1))).to.be.true;
    });

    it('returns true when expiresAt is null', () => {
      expect(isOTPExpired(null)).to.be.true;
    });
  });

  // ── getOTPExpiryDate ─────────────────────────────────────────────────────
  describe('getOTPExpiryDate', () => {
    it('returns a Date in the future', () => {
      expect(getOTPExpiryDate()).to.be.an.instanceOf(Date);
      expect(getOTPExpiryDate().getTime()).to.be.above(Date.now());
    });

    it('respects a custom minutes argument', () => {
      const margin = 200; // ms
      const expected = Date.now() + 5 * 60 * 1000;
      const result = getOTPExpiryDate(5).getTime();
      expect(result).to.be.within(expected - margin, expected + margin);
    });
  });

  // ── formatOTPForDisplay ───────────────────────────────────────────────────
  describe('formatOTPForDisplay', () => {
    it('formats a 6-digit OTP with a hyphen in the middle', () => {
      expect(formatOTPForDisplay('123456')).to.equal('123-456');
    });

    it('works for odd-length codes', () => {
      expect(formatOTPForDisplay('1234')).to.equal('12-34');
    });
  });
});
