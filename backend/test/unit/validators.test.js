'use strict';

const { expect } = require('chai');
const {
  validateEmail,
  validatePassword,
  validateUsername,
  validateNoteTitle,
  validateNoteContent,
  validateRegistration,
  validateNote,
} = require('../../src/utils/validators');

describe('Validators', () => {
  // ── Email ─────────────────────────────────────────────────────────────────
  describe('validateEmail()', () => {
    it('accepts a valid email address', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('rejects an email without @ symbol', () => {
      const result = validateEmail('notanemail');
      expect(result.valid).to.be.false;
      expect(result.errors).to.have.length.above(0);
    });

    it('rejects an empty string', () => {
      const result = validateEmail('');
      expect(result.valid).to.be.false;
    });

    it('rejects null', () => {
      const result = validateEmail(null);
      expect(result.valid).to.be.false;
    });
  });

  // ── Password ──────────────────────────────────────────────────────────────
  describe('validatePassword()', () => {
    it('accepts a strong password', () => {
      const result = validatePassword('StrongPass1!');
      expect(result.valid).to.be.true;
    });

    it('rejects a password that is too short', () => {
      const result = validatePassword('Ab1!');
      expect(result.valid).to.be.false;
    });

    it('rejects a password with no uppercase letter', () => {
      const result = validatePassword('lowercase1!');
      expect(result.valid).to.be.false;
    });

    it('rejects a password with no special character', () => {
      const result = validatePassword('Password123');
      expect(result.valid).to.be.false;
    });

    it('rejects an empty password', () => {
      const result = validatePassword('');
      expect(result.valid).to.be.false;
    });
  });

  // ── Username ──────────────────────────────────────────────────────────────
  describe('validateUsername()', () => {
    it('accepts a valid username', () => {
      const result = validateUsername('testuser123');
      expect(result.valid).to.be.true;
    });

    it('rejects a username that is too short', () => {
      const result = validateUsername('ab');
      expect(result.valid).to.be.false;
    });

    it('rejects a username with special characters', () => {
      const result = validateUsername('user@name');
      expect(result.valid).to.be.false;
    });

    it('rejects an empty username', () => {
      const result = validateUsername('');
      expect(result.valid).to.be.false;
    });
  });

  // ── Note Title ────────────────────────────────────────────────────────────
  describe('validateNoteTitle()', () => {
    it('accepts a valid note title', () => {
      const result = validateNoteTitle('My Shopping List');
      expect(result.valid).to.be.true;
    });

    it('rejects a title exceeding 255 characters', () => {
      const result = validateNoteTitle('A'.repeat(256));
      expect(result.valid).to.be.false;
    });

    it('rejects an empty title', () => {
      const result = validateNoteTitle('');
      expect(result.valid).to.be.false;
    });
  });

  // ── Note Content ─────────────────────────────────────────────────────────
  describe('validateNoteContent()', () => {
    it('accepts valid note content', () => {
      const result = validateNoteContent('This is the note body.');
      expect(result.valid).to.be.true;
    });

    it('accepts empty content (content is optional)', () => {
      const result = validateNoteContent('');
      expect(result.valid).to.be.true;
    });

    it('rejects content exceeding 10 000 characters', () => {
      const result = validateNoteContent('A'.repeat(10001));
      expect(result.valid).to.be.false;
    });
  });

  // ── Registration ─────────────────────────────────────────────────────────
  describe('validateRegistration()', () => {
    it('accepts a valid registration payload', () => {
      const result = validateRegistration({
        email: 'new@example.com',
        password: 'ValidPass1!',
        username: 'newuser',
      });
      expect(result.valid).to.be.true;
    });

    it('returns multiple errors when several fields are invalid', () => {
      const result = validateRegistration({ email: 'bad', password: '123', username: 'x' });
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.above(1);
    });
  });

  // ── Note ─────────────────────────────────────────────────────────────────
  describe('validateNote()', () => {
    it('accepts a valid note payload', () => {
      const result = validateNote({ title: 'My Note', content: 'Some text.' });
      expect(result.valid).to.be.true;
    });

    it('rejects a note without a title', () => {
      const result = validateNote({ content: 'No title here' });
      expect(result.valid).to.be.false;
    });
  });
});
