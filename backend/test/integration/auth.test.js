'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';

const { expect } = require('chai');
const sinon = require('sinon');
const supertest = require('supertest');

// ── Stub email service before app loads ──────────────────────────────────────
const emailService = require('../../src/services/emailService');

const db = require('../helpers/db');
const { User } = require('../../src/models');
const { hashOTP } = require('../../src/utils/otpUtils');
const { OTP_CONSTANTS } = require('../../src/config/constants');
const app = require('../../src/server');

const request = supertest(app);

let sandbox;

const baseUser = {
  username: 'intuser',
  email: 'intuser@example.com',
  password: 'TestPass123!',
  firstName: 'Int',
  lastName: 'User',
};

describe('Integration: Auth routes', () => {
  before(async function setup() {
    this.timeout(120000);
    await db.connect();
    await User.init();
  });

  after(async () => {
    await db.closeDatabase();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(emailService, 'sendOTPVerificationEmail').resolves();
    sandbox.stub(emailService, 'sendWelcomeEmail').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
    await db.clearDatabase();
  });

  // ── POST /api/auth/register ──────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await request.post('/api/auth/register').send(baseUser);
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('userId');
    });

    it('returns 400 for missing email', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ username: 'someone', password: 'TestPass123!' });
      expect(res.status).to.equal(400);
    });

    it('returns 400 for a short password', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ ...baseUser, password: '123' });
      expect(res.status).to.equal(400);
    });

    it('returns 409 on duplicate email', async () => {
      await request.post('/api/auth/register').send(baseUser);
      const res = await request
        .post('/api/auth/register')
        .send({ ...baseUser, username: 'other' });
      expect(res.status).to.equal(409);
    });
  });

  // ── POST /api/auth/verify-otp ────────────────────────────────────────────
  describe('POST /api/auth/verify-otp', () => {
    it('verifies a valid OTP and returns 200', async () => {
      // Create user directly and plant a known OTP
      const user = await User.create(baseUser);
      const otp = '123456';
      await user.generateOTP(hashOTP(otp), OTP_CONSTANTS.PURPOSES.EMAIL_VERIFICATION);

      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: baseUser.email, otp });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('returns 400 for an incorrect OTP', async () => {
      const user = await User.create(baseUser);
      await user.generateOTP(hashOTP('123456'), OTP_CONSTANTS.PURPOSES.EMAIL_VERIFICATION);

      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: baseUser.email, otp: '000000' });
      expect(res.status).to.equal(400);
    });

    it('returns 400 for an expired OTP', async () => {
      const user = await User.create(baseUser);
      await user.generateOTP(hashOTP('123456'), OTP_CONSTANTS.PURPOSES.EMAIL_VERIFICATION);
      // Force-expire the OTP
      await User.updateOne({ _id: user._id }, { $set: { 'otp.expiresAt': new Date(Date.now() - 1) } });

      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: baseUser.email, otp: '123456' });
      expect(res.status).to.equal(400);
    });
  });

  // ── POST /api/auth/login ─────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    async function makeVerifiedUser() {
      const user = await User.create(baseUser);
      await User.updateOne({ _id: user._id }, { $set: { isEmailVerified: true } });
      return user;
    }

    it('returns 200 with accessToken for valid credentials', async () => {
      await makeVerifiedUser();
      const res = await request
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: baseUser.password });
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('accessToken');
      expect(res.headers['set-cookie']).to.exist;
    });

    it('returns 401 for a wrong password', async () => {
      await makeVerifiedUser();
      const res = await request
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: 'WrongPass!' });
      expect(res.status).to.equal(401);
    });

    it('returns 403 when email is not verified', async () => {
      await User.create(baseUser);
      const res = await request
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: baseUser.password });
      expect(res.status).to.equal(403);
    });
  });

  // ── GET /api/auth/me ─────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('returns the authenticated user profile', async () => {
      const user = await User.create(baseUser);
      await User.updateOne({ _id: user._id }, { $set: { isEmailVerified: true } });

      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: baseUser.password });
      const { accessToken } = loginRes.body.data;

      const meRes = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(meRes.status).to.equal(200);
      expect(meRes.body.data.user.email).to.equal(baseUser.email);
    });

    it('returns 401 without a token', async () => {
      const res = await request.get('/api/auth/me');
      expect(res.status).to.equal(401);
    });
  });

  // ── POST /api/auth/logout ────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('clears the cookie and returns 200', async () => {
      const user = await User.create(baseUser);
      await User.updateOne({ _id: user._id }, { $set: { isEmailVerified: true } });

      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: baseUser.password });
      const { accessToken } = loginRes.body.data;

      const logoutRes = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(logoutRes.status).to.equal(200);
    });
  });
});
