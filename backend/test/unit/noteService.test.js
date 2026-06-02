'use strict';

process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const Note = require('../../src/models/Note');
const noteService = require('../../src/services/noteService');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../src/utils/customErrors');
const db = require('../helpers/db');

const OWNER_ID = new mongoose.Types.ObjectId();
const OTHER_ID = new mongoose.Types.ObjectId();
const FAKE_ID = '507f1f77bcf86cd799439011';

function makeNoteData(overrides = {}) {
  return {
    title: 'Service Test Note',
    content: '<p>Service test content</p>',
    tags: ['service', 'test'],
    color: '#ffffff',
    inputMethod: 'typed',
    ...overrides,
  };
}

async function seedNote(overrides = {}) {
  return Note.create({ ...makeNoteData(), userId: OWNER_ID, ...overrides });
}

describe('noteService (unit)', () => {
  before(async function setup() {
    this.timeout(120000);
    await db.connect();
    await Note.init();
  });

  after(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  // ── createNote ─────────────────────────────────────────────────────────────
  describe('createNote()', () => {
    it('creates and returns a note', async () => {
      const note = await noteService.createNote(OWNER_ID, makeNoteData());
      expect(note._id).to.exist;
      expect(note.title).to.equal('Service Test Note');
      expect(note.userId.toString()).to.equal(OWNER_ID.toString());
    });

    it('sanitises the title (trims extra spaces)', async () => {
      const note = await noteService.createNote(OWNER_ID, makeNoteData({ title: '  Padded  ' }));
      expect(note.title).to.equal('Padded');
    });

    it('sanitises tags (lowercase, deduplicated)', async () => {
      const note = await noteService.createNote(OWNER_ID, makeNoteData({ tags: ['TAG', 'tag', 'Tag'] }));
      expect(note.tags).to.deep.equal(['tag']);
    });

    it('throws ValidationError for an invalid voice language', async () => {
      try {
        await noteService.createNote(OWNER_ID, makeNoteData({ inputMethod: 'voice', voiceLanguage: 'fr-FR' }));
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ValidationError);
      }
    });

    it('stores voice metadata when provided', async () => {
      const note = await noteService.createNote(OWNER_ID, makeNoteData({
        inputMethod: 'voice',
        voiceLanguage: 'en-US',
        voiceMetadata: { language: 'en-US', confidenceScore: 0.95 },
      }));
      expect(note.voiceMetadata.languageName).to.equal('English');
      expect(note.voiceMetadata.confidenceScore).to.equal(0.95);
    });
  });

  // ── createVoiceNote ────────────────────────────────────────────────────────
  describe('createVoiceNote()', () => {
    it('creates a voice note with inputMethod=voice', async () => {
      const note = await noteService.createVoiceNote(OWNER_ID, {
        ...makeNoteData(),
        inputMethod: 'voice',
        voiceLanguage: 'en-US',
        voiceMetadata: { language: 'en-US', confidenceScore: 0.9 },
      });
      expect(note.inputMethod).to.equal('voice');
      expect(note.voiceLanguage).to.equal('en-US');
    });

    it('throws ValidationError for an unsupported language', async () => {
      try {
        await noteService.createVoiceNote(OWNER_ID, { ...makeNoteData(), voiceLanguage: 'de-DE' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ValidationError);
      }
    });
  });

  // ── getAllNotes ─────────────────────────────────────────────────────────────
  describe('getAllNotes()', () => {
    beforeEach(async () => {
      await seedNote({ title: 'Alpha' });
      await seedNote({ title: 'Beta', isPinned: true });
      await seedNote({ title: 'Gamma', isArchived: true });
      // note from another user — must never appear
      await Note.create({ ...makeNoteData(), userId: OTHER_ID, title: 'Other' });
    });

    it('returns only the requesting user\'s notes', async () => {
      const result = await noteService.getAllNotes(OWNER_ID, {});
      const titles = result.notes.map((n) => n.title);
      expect(titles).to.not.include('Other');
    });

    it('excludes archived notes by default (isArchived:false)', async () => {
      const result = await noteService.getAllNotes(OWNER_ID, { isArchived: false });
      expect(result.notes.every((n) => !n.isArchived)).to.be.true;
    });

    it('returns pagination metadata', async () => {
      const result = await noteService.getAllNotes(OWNER_ID, { page: 1, limit: 10 });
      expect(result.pagination).to.have.all.keys(
        'currentPage', 'totalPages', 'totalNotes', 'pageSize',
        'hasNextPage', 'hasPrevPage', 'nextPage', 'prevPage'
      );
    });

    it('filters by tag', async () => {
      await seedNote({ title: 'Tagged', tags: ['special'] });
      const result = await noteService.getAllNotes(OWNER_ID, { tags: ['special'] });
      expect(result.notes.some((n) => n.title === 'Tagged')).to.be.true;
    });

    it('respects the limit parameter', async () => {
      const result = await noteService.getAllNotes(OWNER_ID, { limit: 1 });
      expect(result.notes).to.have.lengthOf(1);
      expect(result.pagination.pageSize).to.equal(1);
    });
  });

  // ── getNoteById ─────────────────────────────────────────────────────────────
  describe('getNoteById()', () => {
    it('returns a note the user owns', async () => {
      const created = await seedNote();
      const found = await noteService.getNoteById(created._id.toString(), OWNER_ID);
      expect(found._id.toString()).to.equal(created._id.toString());
    });

    it('throws ValidationError for an invalid ObjectId', async () => {
      try {
        await noteService.getNoteById('not-an-id', OWNER_ID);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ValidationError);
      }
    });

    it('throws NotFoundError when note does not exist', async () => {
      try {
        await noteService.getNoteById(FAKE_ID, OWNER_ID);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
      }
    });

    it('throws ForbiddenError when note belongs to another user', async () => {
      const note = await Note.create({ ...makeNoteData(), userId: OTHER_ID });
      try {
        await noteService.getNoteById(note._id.toString(), OWNER_ID);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ForbiddenError);
      }
    });
  });

  // ── updateNote ─────────────────────────────────────────────────────────────
  describe('updateNote()', () => {
    it('updates title and content', async () => {
      const note = await seedNote();
      const updated = await noteService.updateNote(note._id.toString(), OWNER_ID, {
        title: 'Updated Title',
        content: '<p>Updated</p>',
      });
      expect(updated.title).to.equal('Updated Title');
    });

    it('records edit history', async () => {
      const note = await seedNote();
      await noteService.updateNote(note._id.toString(), OWNER_ID, { title: 'Edit 1' });
      const fresh = await Note.findById(note._id);
      expect(fresh.editHistory).to.have.length.above(0);
    });

    it('transitions inputMethod from typed → mixed when voice metadata is added', async () => {
      const note = await seedNote({ inputMethod: 'typed' });
      const updated = await noteService.updateNote(note._id.toString(), OWNER_ID, {
        voiceMetadata: { language: 'en-US', confidenceScore: 0.9 },
      });
      expect(updated.inputMethod).to.equal('mixed');
    });

    it('throws ForbiddenError when updating another user\'s note', async () => {
      const note = await Note.create({ ...makeNoteData(), userId: OTHER_ID });
      try {
        await noteService.updateNote(note._id.toString(), OWNER_ID, { title: 'Hack' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ForbiddenError);
      }
    });
  });

  // ── softDeleteNote ─────────────────────────────────────────────────────────
  describe('softDeleteNote()', () => {
    it('soft-deletes a note (isDeleted=true, hidden from default queries)', async () => {
      const note = await seedNote();
      await noteService.softDeleteNote(note._id.toString(), OWNER_ID);
      const found = await Note.findById(note._id);
      expect(found).to.be.null; // soft-delete filter hides it
    });

    it('throws an error when the note is no longer visible (already soft-deleted)', async () => {
      // After soft-delete, the pre-find hook filters out isDeleted:true,
      // so verifyNoteOwnership throws NotFoundError before the isDeleted check.
      const note = await seedNote();
      await noteService.softDeleteNote(note._id.toString(), OWNER_ID);
      try {
        await noteService.softDeleteNote(note._id.toString(), OWNER_ID);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
      }
    });
  });

  // ── restoreNote ────────────────────────────────────────────────────────────
  describe('restoreNote()', () => {
    it('restores a soft-deleted note', async () => {
      const note = await seedNote();
      await noteService.softDeleteNote(note._id.toString(), OWNER_ID);
      const restored = await noteService.restoreNote(note._id.toString(), OWNER_ID);
      expect(restored.isDeleted).to.be.false;
    });
  });

  // ── toggleArchive ──────────────────────────────────────────────────────────
  describe('toggleArchive()', () => {
    it('archives a non-archived note', async () => {
      const note = await seedNote({ isArchived: false });
      const toggled = await noteService.toggleArchive(note._id.toString(), OWNER_ID);
      expect(toggled.isArchived).to.be.true;
    });

    it('unarchives an archived note', async () => {
      const note = await seedNote({ isArchived: true });
      const toggled = await noteService.toggleArchive(note._id.toString(), OWNER_ID);
      expect(toggled.isArchived).to.be.false;
    });
  });

  // ── togglePin ──────────────────────────────────────────────────────────────
  describe('togglePin()', () => {
    it('pins an unpinned note', async () => {
      const note = await seedNote({ isPinned: false });
      const toggled = await noteService.togglePin(note._id.toString(), OWNER_ID);
      expect(toggled.isPinned).to.be.true;
    });

    it('unpins a pinned note', async () => {
      const note = await seedNote({ isPinned: true });
      const toggled = await noteService.togglePin(note._id.toString(), OWNER_ID);
      expect(toggled.isPinned).to.be.false;
    });
  });

  // ── addTags / removeTags ───────────────────────────────────────────────────
  describe('addTags()', () => {
    it('merges new tags without duplicates', async () => {
      const note = await seedNote({ tags: ['existing'] });
      const updated = await noteService.addTags(note._id.toString(), OWNER_ID, ['existing', 'new']);
      expect(updated.tags).to.include('new');
      expect(updated.tags.filter((t) => t === 'existing')).to.have.lengthOf(1);
    });

    it('throws ValidationError when tag limit exceeded', async () => {
      const note = await seedNote({ tags: Array(9).fill(null).map((_, i) => `tag${i}`) });
      try {
        await noteService.addTags(note._id.toString(), OWNER_ID, ['a', 'b']);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ValidationError);
      }
    });
  });

  describe('removeTags()', () => {
    it('removes the specified tags', async () => {
      const note = await seedNote({ tags: ['keep', 'remove'] });
      const updated = await noteService.removeTags(note._id.toString(), OWNER_ID, ['remove']);
      expect(updated.tags).to.not.include('remove');
      expect(updated.tags).to.include('keep');
    });
  });

  // ── getUserTags ────────────────────────────────────────────────────────────
  describe('getUserTags()', () => {
    it('returns aggregated tags for the user', async () => {
      await seedNote({ tags: ['alpha', 'beta'] });
      await seedNote({ tags: ['alpha', 'gamma'] });
      const tags = await noteService.getUserTags(OWNER_ID);
      const tagNames = tags.map((t) => t.tag);
      expect(tagNames).to.include('alpha');
      // alpha appears in two notes, so it should be first (sorted by count desc)
      expect(tags[0].tag).to.equal('alpha');
      expect(tags[0].count).to.equal(2);
    });

    it('excludes tags from other users', async () => {
      await Note.create({ ...makeNoteData(), userId: OTHER_ID, tags: ['private'] });
      const tags = await noteService.getUserTags(OWNER_ID);
      expect(tags.map((t) => t.tag)).to.not.include('private');
    });
  });

  // ── getNoteStats ───────────────────────────────────────────────────────────
  describe('getNoteStats()', () => {
    it('returns zeroed stats for a user with no notes', async () => {
      const stats = await noteService.getNoteStats(OTHER_ID);
      expect(stats.total).to.equal(0);
    });

    it('counts total notes correctly', async () => {
      await seedNote();
      await seedNote();
      const stats = await noteService.getNoteStats(OWNER_ID);
      expect(stats.total).to.equal(2);
    });

    it('counts pinned notes', async () => {
      await seedNote({ isPinned: true });
      await seedNote({ isPinned: false });
      const stats = await noteService.getNoteStats(OWNER_ID);
      expect(stats.pinned).to.equal(1);
    });

    it('counts by inputMethod', async () => {
      await seedNote({ inputMethod: 'typed' });
      await seedNote({ inputMethod: 'voice', voiceLanguage: 'en-US' });
      const stats = await noteService.getNoteStats(OWNER_ID);
      expect(stats.byInputMethod.typed).to.equal(1);
      expect(stats.byInputMethod.voice).to.equal(1);
    });

    it('includes notesThisWeek and notesThisMonth', async () => {
      await seedNote();
      const stats = await noteService.getNoteStats(OWNER_ID);
      expect(stats).to.have.property('notesThisWeek');
      expect(stats).to.have.property('notesThisMonth');
    });
  });
});
