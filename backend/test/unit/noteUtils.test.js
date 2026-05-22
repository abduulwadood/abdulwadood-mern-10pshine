'use strict';

process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const mongoose = require('mongoose');
const {
  calculateWordCount,
  calculateCharacterCount,
  calculateReadingTime,
  sanitizeNoteContent,
  sanitizeTitle,
  sanitizeTags,
  validateVoiceLanguage,
  getLanguageDisplayName,
  buildNoteFilterQuery,
  buildNoteSortQuery,
  formatNoteResponse,
  paginateQuery,
  generateNotePreview,
} = require('../../src/utils/noteUtils');

const FAKE_USER_ID = '507f1f77bcf86cd799439011';

describe('noteUtils', () => {
  // ── calculateWordCount ────────────────────────────────────────────────────
  describe('calculateWordCount', () => {
    it('counts words in a normal sentence', () => {
      expect(calculateWordCount('hello world foo')).to.equal(3);
    });

    it('returns 0 for empty string', () => {
      expect(calculateWordCount('')).to.equal(0);
    });

    it('returns 0 for null', () => {
      expect(calculateWordCount(null)).to.equal(0);
    });

    it('returns 0 for undefined', () => {
      expect(calculateWordCount(undefined)).to.equal(0);
    });

    it('handles multiple spaces between words', () => {
      expect(calculateWordCount('hello   world')).to.equal(2);
    });
  });

  // ── calculateCharacterCount ───────────────────────────────────────────────
  describe('calculateCharacterCount', () => {
    it('counts characters in a string', () => {
      expect(calculateCharacterCount('hello')).to.equal(5);
    });

    it('returns 0 for empty string', () => {
      expect(calculateCharacterCount('')).to.equal(0);
    });

    it('returns 0 for null', () => {
      expect(calculateCharacterCount(null)).to.equal(0);
    });

    it('counts spaces and punctuation', () => {
      expect(calculateCharacterCount('hi!')).to.equal(3);
    });
  });

  // ── calculateReadingTime ──────────────────────────────────────────────────
  describe('calculateReadingTime', () => {
    it('returns < 1 min read for fewer than 200 words', () => {
      const result = calculateReadingTime(100);
      expect(result.display).to.equal('< 1 min read');
      expect(result.seconds).to.be.above(0);
    });

    it('returns correct minutes for 400 words', () => {
      const result = calculateReadingTime(400);
      expect(result.display).to.equal('2 min read');
      expect(result.minutes).to.equal(2);
    });

    it('returns object with seconds, minutes, display', () => {
      const result = calculateReadingTime(200);
      expect(result).to.have.all.keys('seconds', 'minutes', 'display');
    });

    it('returns 0 seconds for 0 words', () => {
      const result = calculateReadingTime(0);
      expect(result.seconds).to.equal(0);
    });
  });

  // ── sanitizeNoteContent ───────────────────────────────────────────────────
  describe('sanitizeNoteContent', () => {
    it('trims leading and trailing whitespace', () => {
      expect(sanitizeNoteContent('  hello  ')).to.equal('hello');
    });

    it('removes null characters', () => {
      expect(sanitizeNoteContent('hello\0world')).to.equal('helloworld');
    });

    it('returns empty string for null', () => {
      expect(sanitizeNoteContent(null)).to.equal('');
    });

    it('preserves internal content', () => {
      expect(sanitizeNoteContent('hello world')).to.equal('hello world');
    });
  });

  // ── sanitizeTitle ─────────────────────────────────────────────────────────
  describe('sanitizeTitle', () => {
    it('trims whitespace', () => {
      expect(sanitizeTitle('  Title  ')).to.equal('Title');
    });

    it('collapses multiple spaces to one', () => {
      expect(sanitizeTitle('My   Title')).to.equal('My Title');
    });

    it('returns empty string for null', () => {
      expect(sanitizeTitle(null)).to.equal('');
    });
  });

  // ── sanitizeTags ──────────────────────────────────────────────────────────
  describe('sanitizeTags', () => {
    it('lowercases tags', () => {
      expect(sanitizeTags(['TAG', 'Test'])).to.deep.equal(['tag', 'test']);
    });

    it('trims whitespace from tags', () => {
      expect(sanitizeTags([' hello '])).to.deep.equal(['hello']);
    });

    it('removes duplicate tags', () => {
      expect(sanitizeTags(['tag', 'tag', 'TAG'])).to.deep.equal(['tag']);
    });

    it('removes empty strings', () => {
      expect(sanitizeTags(['', '  ', 'valid'])).to.deep.equal(['valid']);
    });

    it('returns empty array for non-array input', () => {
      expect(sanitizeTags(null)).to.deep.equal([]);
    });
  });

  // ── validateVoiceLanguage ─────────────────────────────────────────────────
  describe('validateVoiceLanguage', () => {
    it('returns true for en-US', () => {
      expect(validateVoiceLanguage('en-US')).to.be.true;
    });

    it('returns true for ur-PK', () => {
      expect(validateVoiceLanguage('ur-PK')).to.be.true;
    });

    it('returns true for auto', () => {
      expect(validateVoiceLanguage('auto')).to.be.true;
    });

    it('returns false for unsupported language', () => {
      expect(validateVoiceLanguage('fr-FR')).to.be.false;
    });

    it('returns false for empty string', () => {
      expect(validateVoiceLanguage('')).to.be.false;
    });
  });

  // ── getLanguageDisplayName ────────────────────────────────────────────────
  describe('getLanguageDisplayName', () => {
    it('returns English for en-US', () => {
      expect(getLanguageDisplayName('en-US')).to.equal('English');
    });

    it('returns Urdu for ur-PK', () => {
      expect(getLanguageDisplayName('ur-PK')).to.equal('Urdu');
    });

    it('returns Auto-detect for auto', () => {
      expect(getLanguageDisplayName('auto')).to.equal('Auto-detect');
    });

    it('returns the code itself for unknown language', () => {
      expect(getLanguageDisplayName('xx-XX')).to.equal('xx-XX');
    });
  });

  // ── buildNoteFilterQuery ──────────────────────────────────────────────────
  describe('buildNoteFilterQuery', () => {
    it('always includes userId and isDeleted: false', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, {});
      expect(q.isDeleted).to.be.false;
      expect(q.userId).to.be.instanceOf(mongoose.Types.ObjectId);
    });

    it('adds $text search when search is provided', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, { search: 'hello' });
      expect(q.$text).to.deep.equal({ $search: 'hello' });
    });

    it('adds tags filter when tags array is provided', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, { tags: ['work', 'personal'] });
      expect(q.tags).to.deep.equal({ $in: ['work', 'personal'] });
    });

    it('adds tags filter when tags is a comma-separated string', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, { tags: 'work,personal' });
      expect(q.tags).to.deep.equal({ $in: ['work', 'personal'] });
    });

    it('adds isPinned filter', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, { isPinned: true });
      expect(q.isPinned).to.be.true;
    });

    it('adds inputMethod filter', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, { inputMethod: 'voice' });
      expect(q.inputMethod).to.equal('voice');
    });

    it('adds voiceLanguage filter to voiceMetadata.language', () => {
      const q = buildNoteFilterQuery(FAKE_USER_ID, { voiceLanguage: 'ur-PK' });
      expect(q['voiceMetadata.language']).to.equal('ur-PK');
    });

    it('adds date range filters', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');
      const q = buildNoteFilterQuery(FAKE_USER_ID, { dateFrom: from, dateTo: to });
      expect(q.createdAt.$gte).to.deep.equal(from);
      expect(q.createdAt.$lte).to.deep.equal(to);
    });
  });

  // ── buildNoteSortQuery ────────────────────────────────────────────────────
  describe('buildNoteSortQuery', () => {
    it('returns createdAt desc for -createdAt', () => {
      expect(buildNoteSortQuery('-createdAt')).to.deep.equal({ createdAt: -1 });
    });

    it('returns createdAt asc for createdAt', () => {
      expect(buildNoteSortQuery('createdAt')).to.deep.equal({ createdAt: 1 });
    });

    it('returns title asc for title', () => {
      expect(buildNoteSortQuery('title')).to.deep.equal({ title: 1 });
    });

    it('returns title desc for -title', () => {
      expect(buildNoteSortQuery('-title')).to.deep.equal({ title: -1 });
    });

    it('returns updatedAt desc for -updatedAt', () => {
      expect(buildNoteSortQuery('-updatedAt')).to.deep.equal({ updatedAt: -1 });
    });

    it('defaults to pinned-first then newest for unknown sort', () => {
      expect(buildNoteSortQuery('unknown')).to.deep.equal({ isPinned: -1, createdAt: -1 });
    });

    it('defaults to pinned-first when no sort provided', () => {
      expect(buildNoteSortQuery(undefined)).to.deep.equal({ isPinned: -1, createdAt: -1 });
    });
  });

  // ── formatNoteResponse ────────────────────────────────────────────────────
  describe('formatNoteResponse', () => {
    it('removes isDeleted, deletedAt, editHistory, __v fields', () => {
      const note = {
        _id: '123',
        title: 'T',
        content: 'C',
        isDeleted: false,
        deletedAt: null,
        editHistory: [],
        __v: 0,
      };
      const result = formatNoteResponse(note);
      expect(result).to.not.have.property('isDeleted');
      expect(result).to.not.have.property('deletedAt');
      expect(result).to.not.have.property('editHistory');
      expect(result).to.not.have.property('__v');
    });

    it('retains core note fields', () => {
      const note = { _id: '123', title: 'T', content: 'C', isDeleted: false };
      const result = formatNoteResponse(note);
      expect(result).to.have.property('title', 'T');
      expect(result).to.have.property('content', 'C');
    });

    it('works with Mongoose document (has toObject)', () => {
      const fakeDoc = {
        title: 'T',
        content: 'C',
        isDeleted: false,
        deletedAt: null,
        editHistory: [],
        toObject() { return { ...this, toObject: undefined }; },
      };
      const result = formatNoteResponse(fakeDoc);
      expect(result).to.have.property('title', 'T');
      expect(result).to.not.have.property('isDeleted');
    });
  });

  // ── paginateQuery ─────────────────────────────────────────────────────────
  describe('paginateQuery', () => {
    it('returns correct skip and limit for page 1', () => {
      const { skip, limit } = paginateQuery(1, 10);
      expect(skip).to.equal(0);
      expect(limit).to.equal(10);
    });

    it('returns correct skip for page 3', () => {
      const { skip } = paginateQuery(3, 10);
      expect(skip).to.equal(20);
    });

    it('clamps limit to MAX_PAGE_SIZE', () => {
      const { limit } = paginateQuery(1, 9999);
      expect(limit).to.equal(100);
    });

    it('uses default page size when limit is not provided', () => {
      const { limit } = paginateQuery(1, undefined);
      expect(limit).to.equal(10);
    });

    it('uses page 1 as minimum', () => {
      const { skip } = paginateQuery(-5, 10);
      expect(skip).to.equal(0);
    });
  });

  // ── generateNotePreview ───────────────────────────────────────────────────
  describe('generateNotePreview', () => {
    it('returns full content when shorter than maxLength', () => {
      expect(generateNotePreview('short content')).to.equal('short content');
    });

    it('truncates at word boundary and appends ellipsis', () => {
      const content = 'word '.repeat(40); // 200 chars
      const preview = generateNotePreview(content, 20);
      expect(preview).to.match(/\.\.\.$/);
      expect(preview.length).to.be.at.most(23); // 20 + '...'
    });

    it('returns empty string for null content', () => {
      expect(generateNotePreview(null)).to.equal('');
    });

    it('custom maxLength is respected', () => {
      const content = 'a'.repeat(200);
      const preview = generateNotePreview(content, 50);
      expect(preview).to.include('...');
    });
  });
});
