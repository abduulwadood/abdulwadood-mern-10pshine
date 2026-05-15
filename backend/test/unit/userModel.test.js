'use strict';

process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const bcrypt = require('bcryptjs');
const db = require('../helpers/db');
const { User } = require('../../src/models');
const { validUser, invalidUsers } = require('../fixtures/testData');

describe('User Model', () => {
  before(async function setup() {
    this.timeout(120000); // first run downloads the in-memory mongo binary
    await db.connect();
    await User.init(); // build indexes (needed for unique constraints)
  });

  after(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  // ── Schema validation ──────────────────────────────────────────────────────
  describe('Schema validation', () => {
    it('creates a valid user with all required fields', async () => {
      const user = await User.create(validUser);
      expect(user._id).to.exist;
      expect(user.username).to.equal('testuser');
    });

    it('fails without the email field', async () => {
      try {
        await User.create(invalidUsers.noEmail);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('email');
      }
    });

    it('fails without the username field', async () => {
      try {
        await User.create({ email: 'a@b.com', password: 'TestPass123!' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('username');
      }
    });

    it('fails without the password field', async () => {
      try {
        await User.create({ username: 'someuser', email: 'a@b.com' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('password');
      }
    });

    it('fails with an invalid email format', async () => {
      try {
        await User.create(invalidUsers.invalidEmail);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('email');
      }
    });

    it('fails with a username shorter than the minimum length', async () => {
      try {
        await User.create(invalidUsers.shortUsername);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('username');
      }
    });

    it('fails with a username containing special characters', async () => {
      try {
        await User.create(invalidUsers.invalidUsername);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('username');
      }
    });

    it('fails with a password shorter than the minimum length', async () => {
      try {
        await User.create(invalidUsers.shortPassword);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('password');
      }
    });

    it('enforces the unique email constraint', async () => {
      await User.create(validUser);
      try {
        await User.create({ ...validUser, username: 'different' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });

    it('enforces the unique username constraint', async () => {
      await User.create(validUser);
      try {
        await User.create({ ...validUser, email: 'other@example.com' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });

    it('converts email and username to lowercase and trims them', async () => {
      const user = await User.create({
        username: '  TestUser  ',
        email: '  TEST@Example.COM ',
        password: 'TestPass123!',
      });
      expect(user.username).to.equal('testuser');
      expect(user.email).to.equal('test@example.com');
    });
  });

  // ── Virtuals ───────────────────────────────────────────────────────────────
  describe('Virtual fields', () => {
    it('returns the correct fullName', async () => {
      const user = await User.create(validUser);
      expect(user.fullName).to.equal('Test User');
    });

    it('returns an empty string for fullName when names are absent', async () => {
      const user = await User.create({
        username: 'noname',
        email: 'noname@example.com',
        password: 'TestPass123!',
      });
      expect(user.fullName).to.equal('');
    });

    it('isLocked is false when not locked', async () => {
      const user = await User.create(validUser);
      expect(user.isLocked).to.be.false;
    });

    it('isLocked is true when lockUntil is in the future', async () => {
      const user = await User.create(validUser);
      user.lockUntil = new Date(Date.now() + 60000);
      expect(user.isLocked).to.be.true;
    });
  });

  // ── Instance methods ───────────────────────────────────────────────────────
  describe('Instance methods', () => {
    it('comparePassword returns true for the correct password', async () => {
      const user = await User.create(validUser);
      expect(await user.comparePassword('TestPass123!')).to.be.true;
    });

    it('comparePassword returns false for an incorrect password', async () => {
      const user = await User.create(validUser);
      expect(await user.comparePassword('WrongPass1!')).to.be.false;
    });

    it('incrementLoginAttempts increments the counter', async () => {
      const user = await User.create(validUser);
      await user.incrementLoginAttempts();
      expect(user.loginAttempts).to.equal(1);
    });

    it('locks the account after the maximum attempts', async () => {
      const user = await User.create(validUser);
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await user.incrementLoginAttempts();
      }
      expect(user.loginAttempts).to.be.at.least(5);
      expect(user.isLocked).to.be.true;
    });

    it('resetLoginAttempts resets the counter to 0', async () => {
      const user = await User.create(validUser);
      await user.incrementLoginAttempts();
      await user.resetLoginAttempts();
      expect(user.loginAttempts).to.equal(0);
      expect(user.isLocked).to.be.false;
    });
  });

  // ── Static methods ─────────────────────────────────────────────────────────
  describe('Static methods', () => {
    it('findByEmail returns the user (with password) when found', async () => {
      await User.create(validUser);
      const found = await User.findByEmail('test@example.com');
      expect(found).to.exist;
      expect(found.password).to.be.a('string');
    });

    it('findByEmail returns null when not found', async () => {
      const found = await User.findByEmail('missing@example.com');
      expect(found).to.be.null;
    });

    it('findByUsername returns the user when found', async () => {
      await User.create(validUser);
      const found = await User.findByUsername('testuser');
      expect(found).to.exist;
    });

    it('findActiveUsers returns only active users', async () => {
      await User.create(validUser);
      await User.create({
        username: 'inactive',
        email: 'inactive@example.com',
        password: 'TestPass123!',
        isActive: false,
      });
      const active = await User.findActiveUsers();
      expect(active).to.have.lengthOf(1);
      expect(active[0].username).to.equal('testuser');
    });
  });

  // ── Pre-save hook ──────────────────────────────────────────────────────────
  describe('Pre-save hook', () => {
    it('hashes the password before saving', async () => {
      const user = await User.create(validUser);
      expect(user.password).to.not.equal('TestPass123!');
      expect(await bcrypt.compare('TestPass123!', user.password)).to.be.true;
    });

    it('does not rehash the password when it is not modified', async () => {
      const user = await User.create(validUser);
      const originalHash = user.password;
      user.firstName = 'Changed';
      await user.save();
      expect(user.password).to.equal(originalHash);
    });
  });

  // ── JSON transform ─────────────────────────────────────────────────────────
  describe('JSON transform', () => {
    it('strips sensitive fields and keeps the fullName virtual', async () => {
      const user = await User.create(validUser);
      const json = user.toJSON();
      expect(json).to.not.have.property('password');
      expect(json).to.not.have.property('refreshToken');
      expect(json).to.not.have.property('loginAttempts');
      expect(json).to.not.have.property('lockUntil');
      expect(json.fullName).to.equal('Test User');
    });
  });

  // ── Defaults ───────────────────────────────────────────────────────────────
  describe('Default values', () => {
    it('applies the correct defaults', async () => {
      const user = await User.create({
        username: 'defaults',
        email: 'defaults@example.com',
        password: 'TestPass123!',
      });
      expect(user.isActive).to.be.true;
      expect(user.isEmailVerified).to.be.false;
      expect(user.loginAttempts).to.equal(0);
    });
  });
});
