'use strict';

process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const sinon = require('sinon');

// emailService uses `emailConfig.getTransporter()` (module reference, not destructured),
// so sinon can replace it via the module object.
const emailConfig = require('../../src/config/emailConfig');

// Force a fresh load so our stub is picked up before the module caches its reference
delete require.cache[require.resolve('../../src/services/emailService')];
const emailService = require('../../src/services/emailService');

const fakeUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'user@example.com',
  firstName: 'Test',
  username: 'testuser',
};

describe('emailService (unit)', () => {
  let sandbox;
  let sendMailStub;
  let fakeTransporter;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub the transporter returned by getTransporter()
    sendMailStub = sandbox.stub().resolves({ messageId: 'test-message-id' });
    fakeTransporter = { sendMail: sendMailStub };
    sandbox.stub(emailConfig, 'getTransporter').returns(fakeTransporter);
  });

  afterEach(() => {
    sandbox.restore();
  });

  // ── sendOTPVerificationEmail ───────────────────────────────────────────────
  describe('sendOTPVerificationEmail()', () => {
    it('calls sendMail with the correct recipient', async () => {
      await emailService.sendOTPVerificationEmail(fakeUser, '123456');
      expect(sendMailStub.calledOnce).to.be.true;
      const args = sendMailStub.firstCall.args[0];
      expect(args.to).to.equal(fakeUser.email);
    });

    it('returns the messageId from the transporter', async () => {
      const info = await emailService.sendOTPVerificationEmail(fakeUser, '123456');
      expect(info.messageId).to.equal('test-message-id');
    });

    it('propagates errors thrown by the transporter', async () => {
      sendMailStub.rejects(new Error('SMTP connection refused'));
      try {
        await emailService.sendOTPVerificationEmail(fakeUser, '123456');
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('SMTP connection refused');
      }
    });
  });

  // ── sendWelcomeEmail ───────────────────────────────────────────────────────
  describe('sendWelcomeEmail()', () => {
    it('calls sendMail with the correct recipient', async () => {
      await emailService.sendWelcomeEmail(fakeUser);
      expect(sendMailStub.calledOnce).to.be.true;
      const args = sendMailStub.firstCall.args[0];
      expect(args.to).to.equal(fakeUser.email);
    });

    it('includes html in the mail options', async () => {
      await emailService.sendWelcomeEmail(fakeUser);
      const args = sendMailStub.firstCall.args[0];
      expect(args.html).to.be.a('string').and.not.empty;
    });

    it('propagates transporter errors', async () => {
      sendMailStub.rejects(new Error('Quota exceeded'));
      try {
        await emailService.sendWelcomeEmail(fakeUser);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Quota exceeded');
      }
    });
  });

  // ── sendPasswordResetEmail ─────────────────────────────────────────────────
  describe('sendPasswordResetEmail()', () => {
    it('calls sendMail with the correct recipient', async () => {
      await emailService.sendPasswordResetEmail(fakeUser, 'reset-token-abc');
      expect(sendMailStub.calledOnce).to.be.true;
      const args = sendMailStub.firstCall.args[0];
      expect(args.to).to.equal(fakeUser.email);
    });

    it('propagates transporter errors', async () => {
      sendMailStub.rejects(new Error('Bad credentials'));
      try {
        await emailService.sendPasswordResetEmail(fakeUser, 'token');
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Bad credentials');
      }
    });
  });
});
