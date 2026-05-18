'use strict';

process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const mongoose = require('mongoose');
const db = require('../helpers/db');
const { Note } = require('../../src/models');

const userId = new mongoose.Types.ObjectId();

function makeNote(overrides = {}) {
  return {
    title: 'Test Note Title',
    content: 'This is the content of the test note.',
    userId,
    ...overrides,
  };
}

describe('Note Model', () => {
  before(async function setup() {
    this.timeout(120000);
    await db.connect();
    await Note.init(); // build indexes (incl. the text index used by searchNotes)
  });

  after(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  // ── Schema validation ──────────────────────────────────────────────────────
  describe('Schema validation', () => {
    it('creates a valid note with all required fields', async () => {
      const note = await Note.create(makeNote({ tags: ['a', 'b'], color: '#abcdef' }));
      expect(note._id).to.exist;
      expect(note.tags).to.deep.equal(['a', 'b']);
    });

    it('fails without a title', async () => {
      try {
        await Note.create(makeNote({ title: undefined }));
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('title');
      }
    });

    it('fails without content', async () => {
      try {
        await Note.create(makeNote({ content: undefined }));
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('content');
      }
    });

    it('fails without a userId', async () => {
      try {
        await Note.create({ title: 'T', content: 'C' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('userId');
      }
    });

    it('fails with a title exceeding the max length', async () => {
      try {
        await Note.create(makeNote({ title: 'a'.repeat(201) }));
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('title');
      }
    });

    it('fails with more than the maximum allowed tags', async () => {
      try {
        await Note.create(makeNote({ tags: Array(11).fill('tag') }));
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('tags');
      }
    });

    it('fails with an invalid hex color', async () => {
      try {
        await Note.create(makeNote({ color: 'not-a-color' }));
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.errors).to.have.property('color');
      }
    });

    it('accepts a valid hex color', async () => {
      const note = await Note.create(makeNote({ color: '#123abc' }));
      expect(note.color).to.equal('#123abc');
    });

    it('applies the correct defaults', async () => {
      const note = await Note.create(makeNote());
      expect(note.tags).to.deep.equal([]);
      expect(note.isArchived).to.be.false;
      expect(note.isPinned).to.be.false;
      expect(note.isDeleted).to.be.false;
      expect(note.color).to.equal('#ffffff');
    });

    it('trims and lowercases tags', async () => {
      const note = await Note.create(makeNote({ tags: ['  Work ', 'IMPORTANT'] }));
      expect(note.tags).to.deep.equal(['work', 'important']);
    });
  });

  // ── Instance methods ───────────────────────────────────────────────────────
  describe('Instance methods', () => {
    it('softDelete sets isDeleted and deletedAt', async () => {
      const note = await Note.create(makeNote());
      await note.softDelete();
      expect(note.isDeleted).to.be.true;
      expect(note.deletedAt).to.be.an.instanceOf(Date);
    });

    it('restore clears the soft-delete flags', async () => {
      const note = await Note.create(makeNote());
      await note.softDelete();
      await note.restore();
      expect(note.isDeleted).to.be.false;
      expect(note.deletedAt).to.be.null;
    });

    it('archive / unarchive toggle isArchived', async () => {
      const note = await Note.create(makeNote());
      await note.archive();
      expect(note.isArchived).to.be.true;
      await note.unarchive();
      expect(note.isArchived).to.be.false;
    });

    it('togglePin flips isPinned', async () => {
      const note = await Note.create(makeNote());
      await note.togglePin();
      expect(note.isPinned).to.be.true;
      await note.togglePin();
      expect(note.isPinned).to.be.false;
    });
  });

  // ── Static methods ─────────────────────────────────────────────────────────
  describe('Static methods', () => {
    it('findByUser returns paginated, non-deleted notes for the user', async () => {
      await Note.create(makeNote({ title: 'One' }));
      const deleted = await Note.create(makeNote({ title: 'Two' }));
      await deleted.softDelete();

      const result = await Note.findByUser(userId);
      expect(result.docs).to.have.lengthOf(1);
      expect(result.totalDocs).to.equal(1);
      expect(result.docs[0].title).to.equal('One');
    });

    it('findByTag returns notes with a matching tag', async () => {
      await Note.create(makeNote({ tags: ['work'] }));
      await Note.create(makeNote({ tags: ['home'] }));
      const result = await Note.findByTag(userId, 'WORK');
      expect(result).to.have.lengthOf(1);
    });

    it('searchNotes performs a full-text search', async () => {
      await Note.create(makeNote({ title: 'Grocery list', content: 'apples and bananas' }));
      await Note.create(makeNote({ title: 'Meeting notes', content: 'project deadline' }));
      const result = await Note.searchNotes(userId, 'grocery');
      expect(result).to.have.lengthOf(1);
      expect(result[0].title).to.equal('Grocery list');
    });

    it('getArchivedNotes returns only archived notes', async () => {
      const a = await Note.create(makeNote());
      await a.archive();
      await Note.create(makeNote());
      const result = await Note.getArchivedNotes(userId);
      expect(result).to.have.lengthOf(1);
    });

    it('getPinnedNotes returns only pinned notes', async () => {
      const p = await Note.create(makeNote());
      await p.togglePin();
      await Note.create(makeNote());
      const result = await Note.getPinnedNotes(userId);
      expect(result).to.have.lengthOf(1);
    });
  });

  // ── Pre-save hook ──────────────────────────────────────────────────────────
  describe('Pre-save hook', () => {
    it('updates lastEditedAt when content changes', async () => {
      const note = await Note.create(makeNote());
      const original = note.lastEditedAt.getTime();
      await new Promise((r) => setTimeout(r, 10));
      note.content = 'Updated content';
      await note.save();
      expect(note.lastEditedAt.getTime()).to.be.above(original);
    });
  });

  // ── Pre-find hook (soft delete) ────────────────────────────────────────────
  describe('Pre-find hook', () => {
    it('automatically excludes soft-deleted notes', async () => {
      const note = await Note.create(makeNote());
      await note.softDelete();
      const found = await Note.findById(note._id);
      expect(found).to.be.null;
    });

    it('can include deleted notes with the withDeleted option', async () => {
      const note = await Note.create(makeNote());
      await note.softDelete();
      const found = await Note.findOne({ _id: note._id }).setOptions({ withDeleted: true });
      expect(found).to.exist;
      expect(found.isDeleted).to.be.true;
    });
  });

  // ── Timestamps ─────────────────────────────────────────────────────────────
  describe('Timestamps', () => {
    it('sets createdAt and updates updatedAt on modification', async () => {
      const note = await Note.create(makeNote());
      expect(note.createdAt).to.be.an.instanceOf(Date);
      const createdUpdatedAt = note.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 10));
      note.title = 'Renamed';
      await note.save();
      expect(note.updatedAt.getTime()).to.be.above(createdUpdatedAt);
    });
  });
});
