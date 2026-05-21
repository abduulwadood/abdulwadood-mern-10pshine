'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';

const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');

// ── Stub email before requiring the controller ───────────────────────────────
const emailService = require('../../src/services/emailService');

const { User } = require('../../src/models');
const { generateAccessToken, generateRefreshToken } = require('../../src/utils/jwtUtils');
const { hashOTP } = require('../../src/utils/otpUtils');
const authController = require('../../src/controllers/authController');
const { HTTP_STATUS, OTP_CONSTANTS } = require('../../src/config/constants');

// ── Minimal express mock ─────────────────────────────────────────────────────

function makeRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.cookie = sinon.stub().returns(res);
  res.clearCookie = sinon.stub().returns(res);
  return res;
}

function makeReq(body = {}, cookies = {}, user = null, headers = {}) {
  return { body, cookies, user, headers };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    username: 'authuser',
    email: 'authuser@example.com',
    firstName: 'Auth',
    lastName: 'User',
    isActive: true,
    isEmailVerified: true,
    loginAttempts: 0,
    lockUntil: null,
    password: null,
    refreshToken: null,
    otp: { code: null, expiresAt: null, attempts: 0, lastSentAt: null, purpose: null },
    get isLocked() { return !!(this.lockUntil && this.lockUntil > Date.now()); },
    comparePassword: sinon.stub().resolves(true),
    incrementLoginAttempts: sinon.stub().resolves(),
    resetLoginAttempts: sinon.stub().resolves(),
    generateOTP: sinon.stub().resolves(),
    verifyOTP: sinon.stub().resolves({ valid: true }),
    canResendOTP: sinon.stub().returns(true),
    clearOTP: sinon.stub().resolves(),
    updateOne: sinon.stub().resolves(),
    toJSON: sinon.stub().returns({ username: 'authuser', email: 'authuser@example.com' }),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Auth Controller (unit)', () => {
  let sandbox;
  let sendOTPStub;
  let sendWelcomeStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sendOTPStub = sandbox.stub(emailService, 'sendOTPVerificationEmail').resolves();
    sendWelcomeStub = sandbox.stub(emailService, 'sendWelcomeEmail').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // ── register ─────────────────────────────────────────────────────────────
  describe('register', () => {
    it('creates a user and sends OTP email on valid input', async () => {
      const user = makeUser({ isEmailVerified: false });
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User, 'create').resolves(user);

      const req = makeReq({ username: 'authuser', email: 'authuser@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.register(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.CREATED)).to.be.true;
      expect(sendOTPStub.calledOnce).to.be.true;
    });

    it('returns 409 when email already exists', async () => {
      const existingUser = makeUser();
      sandbox.stub(User, 'findOne').resolves(existingUser);

      const req = makeReq({ username: 'other', email: 'authuser@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.register(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.CONFLICT)).to.be.true;
    });

    it('returns 409 when username already exists', async () => {
      const existingUser = makeUser({ email: 'different@example.com' });
      sandbox.stub(User, 'findOne').resolves(existingUser);

      const req = makeReq({ username: 'authuser', email: 'new@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.register(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.CONFLICT)).to.be.true;
    });
  });

  // ── verifyOTP ────────────────────────────────────────────────────────────
  describe('verifyOTP', () => {
    it('returns 200 and sends welcome email on valid OTP', async () => {
      const user = makeUser({ isEmailVerified: false });
      sandbox.stub(User, 'findOne').returns({ select: sinon.stub().resolves(user) });

      const req = makeReq({ email: 'authuser@example.com', otp: '123456' });
      const res = makeRes();
      await authController.verifyOTP(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(sendWelcomeStub.calledOnce).to.be.true;
    });

    it('returns 400 for an invalid OTP', async () => {
      const user = makeUser({
        isEmailVerified: false,
        verifyOTP: sinon.stub().resolves({ valid: false, reason: 'invalid' }),
      });
      sandbox.stub(User, 'findOne').returns({ select: sinon.stub().resolves(user) });

      const req = makeReq({ email: 'authuser@example.com', otp: '000000' });
      const res = makeRes();
      await authController.verifyOTP(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.BAD_REQUEST)).to.be.true;
    });

    it('returns 400 for an expired OTP', async () => {
      const user = makeUser({
        isEmailVerified: false,
        verifyOTP: sinon.stub().resolves({ valid: false, reason: 'expired' }),
      });
      sandbox.stub(User, 'findOne').returns({ select: sinon.stub().resolves(user) });

      const req = makeReq({ email: 'authuser@example.com', otp: '123456' });
      const res = makeRes();
      await authController.verifyOTP(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.BAD_REQUEST)).to.be.true;
    });

    it('returns 404 when user is not found', async () => {
      sandbox.stub(User, 'findOne').returns({ select: sinon.stub().resolves(null) });

      const req = makeReq({ email: 'nobody@example.com', otp: '123456' });
      const res = makeRes();
      await authController.verifyOTP(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.NOT_FOUND)).to.be.true;
    });
  });

  // ── resendOTP ────────────────────────────────────────────────────────────
  describe('resendOTP', () => {
    it('resends OTP when cooldown has elapsed', async () => {
      const user = makeUser({ isEmailVerified: false });
      sandbox.stub(User, 'findOne').resolves(user);

      const req = makeReq({ email: 'authuser@example.com' });
      const res = makeRes();
      await authController.resendOTP(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(sendOTPStub.calledOnce).to.be.true;
    });

    it('returns 429 when cooldown has not elapsed', async () => {
      const user = makeUser({
        isEmailVerified: false,
        canResendOTP: sinon.stub().returns(false),
      });
      sandbox.stub(User, 'findOne').resolves(user);

      const req = makeReq({ email: 'authuser@example.com' });
      const res = makeRes();
      await authController.resendOTP(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.TOO_MANY_REQUESTS)).to.be.true;
    });
  });

  // ── login ────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('returns 200 with accessToken on valid credentials', async () => {
      const user = makeUser();
      // findByEmail calls .select('+password') internally, stub the whole static
      sandbox.stub(User, 'findByEmail').resolves(user);

      const req = makeReq({ email: 'authuser@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.login(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      const jsonArg = res.json.firstCall.args[0];
      expect(jsonArg.data).to.have.property('accessToken');
    });

    it('returns 401 for invalid credentials', async () => {
      const user = makeUser({ comparePassword: sinon.stub().resolves(false) });
      sandbox.stub(User, 'findByEmail').resolves(user);

      const req = makeReq({ email: 'authuser@example.com', password: 'WrongPass!' });
      const res = makeRes();
      await authController.login(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.UNAUTHORIZED)).to.be.true;
    });

    it('returns 401 when user is not found', async () => {
      sandbox.stub(User, 'findByEmail').resolves(null);

      const req = makeReq({ email: 'nobody@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.login(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.UNAUTHORIZED)).to.be.true;
    });

    it('returns 401 when account is locked', async () => {
      const user = makeUser({ lockUntil: new Date(Date.now() + 60000) });
      sandbox.stub(User, 'findByEmail').resolves(user);

      const req = makeReq({ email: 'authuser@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.login(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.UNAUTHORIZED)).to.be.true;
    });

    it('returns 403 when email is not verified', async () => {
      const user = makeUser({ isEmailVerified: false });
      sandbox.stub(User, 'findByEmail').resolves(user);

      const req = makeReq({ email: 'authuser@example.com', password: 'TestPass123!' });
      const res = makeRes();
      await authController.login(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.FORBIDDEN)).to.be.true;
    });
  });

  // ── refreshToken ─────────────────────────────────────────────────────────
  describe('refreshToken', () => {
    it('returns 401 when no cookie is present', async () => {
      const req = makeReq({}, {});
      const res = makeRes();
      await authController.refreshToken(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.UNAUTHORIZED)).to.be.true;
    });

    it('returns 401 for an invalid refresh token', async () => {
      const req = makeReq({}, { refreshToken: 'invalid.token.here' });
      const res = makeRes();
      await authController.refreshToken(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.UNAUTHORIZED)).to.be.true;
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('clears the refresh token cookie and returns 200', async () => {
      const user = makeUser();
      const req = makeReq({}, {}, user);
      const res = makeRes();
      await authController.logout(req, res, sinon.stub());

      expect(res.clearCookie.calledOnce).to.be.true;
      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
    });
  });

  // ── getMe ────────────────────────────────────────────────────────────────
  describe('getMe', () => {
    it('returns the current user profile', async () => {
      const user = makeUser();
      const req = makeReq({}, {}, user);
      const res = makeRes();
      await authController.getMe(req, res, sinon.stub());

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(user.toJSON.calledOnce).to.be.true;
    });
  });
});
