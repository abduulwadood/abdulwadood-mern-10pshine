'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';

const { expect } = require('chai');
const sinon = require('sinon');

// Require module references so sinon can stub properties
const noteService = require('../../src/services/noteService');
const noteController = require('../../src/controllers/noteController');
const { HTTP_STATUS } = require('../../src/config/constants');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.cookie = sinon.stub().returns(res);
  res.clearCookie = sinon.stub().returns(res);
  return res;
}

function makeNext() {
  return sinon.stub();
}

function makeReq(overrides = {}) {
  return {
    user: { _id: '507f1f77bcf86cd799439011' },
    body: {},
    params: { id: '60a5c2b4f2b2a3d4e5f6a7b8' },
    query: {},
    ...overrides,
  };
}

const fakeNote = {
  _id: '60a5c2b4f2b2a3d4e5f6a7b8',
  title: 'Test Note',
  content: 'Test content',
  inputMethod: 'typed',
  isPinned: false,
  isArchived: false,
  tags: [],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('noteController unit tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // ── createNote ─────────────────────────────────────────────────────────────
  describe('createNote', () => {
    it('returns 201 with created note', async () => {
      sandbox.stub(noteService, 'createNote').resolves(fakeNote);

      const req = makeReq({ body: { title: 'Test', content: 'Content' } });
      const res = makeRes();
      const next = makeNext();

      await noteController.createNote(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.CREATED)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.be.true;
      expect(payload.data.note).to.deep.equal(fakeNote);
    });

    it('calls next with error when service throws', async () => {
      sandbox.stub(noteService, 'createNote').rejects(new Error('DB error'));

      const req = makeReq({ body: { title: 'T', content: 'C' } });
      const res = makeRes();
      const next = makeNext();

      await noteController.createNote(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    });
  });

  // ── createVoiceNote ────────────────────────────────────────────────────────
  describe('createVoiceNote', () => {
    it('returns 201 with voice note', async () => {
      const voiceNote = { ...fakeNote, inputMethod: 'voice' };
      sandbox.stub(noteService, 'createVoiceNote').resolves(voiceNote);

      const req = makeReq({
        body: { title: 'Voice', content: 'spoken', voiceLanguage: 'en-US' },
      });
      const res = makeRes();
      const next = makeNext();

      await noteController.createVoiceNote(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.CREATED)).to.be.true;
      expect(res.json.firstCall.args[0].data.note.inputMethod).to.equal('voice');
    });
  });

  // ── getAllNotes ────────────────────────────────────────────────────────────
  describe('getAllNotes', () => {
    it('returns 200 with paginated notes result', async () => {
      const result = {
        notes: [fakeNote],
        pagination: { currentPage: 1, totalPages: 1, totalNotes: 1, pageSize: 10 },
        appliedFilters: {},
        sort: {},
      };
      sandbox.stub(noteService, 'getAllNotes').resolves(result);

      const req = makeReq({ query: { page: 1, limit: 10 } });
      const res = makeRes();
      const next = makeNext();

      await noteController.getAllNotes(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.be.true;
      expect(payload.data.notes).to.have.length(1);
      expect(payload.data.pagination).to.exist;
    });
  });

  // ── getNoteById ────────────────────────────────────────────────────────────
  describe('getNoteById', () => {
    it('returns 200 with single note', async () => {
      sandbox.stub(noteService, 'getNoteById').resolves(fakeNote);

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.getNoteById(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(res.json.firstCall.args[0].data.note).to.deep.equal(fakeNote);
    });
  });

  // ── updateNote ─────────────────────────────────────────────────────────────
  describe('updateNote', () => {
    it('returns 200 with updated note', async () => {
      const updated = { ...fakeNote, title: 'Updated' };
      sandbox.stub(noteService, 'updateNote').resolves(updated);

      const req = makeReq({ body: { title: 'Updated' } });
      const res = makeRes();
      const next = makeNext();

      await noteController.updateNote(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(res.json.firstCall.args[0].data.note.title).to.equal('Updated');
    });
  });

  // ── updateNoteWithVoice ────────────────────────────────────────────────────
  describe('updateNoteWithVoice', () => {
    it('returns 200 and note with updated voice metadata', async () => {
      const updated = {
        ...fakeNote,
        inputMethod: 'mixed',
        voiceMetadata: { voiceEditCount: 1, language: 'en-US' },
      };
      sandbox.stub(noteService, 'updateNoteWithVoice').resolves(updated);

      const req = makeReq({
        body: { content: 'new voice content', voiceLanguage: 'en-US', appendToExisting: false },
      });
      const res = makeRes();
      const next = makeNext();

      await noteController.updateNoteWithVoice(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      const data = res.json.firstCall.args[0].data;
      expect(data.note.inputMethod).to.equal('mixed');
    });
  });

  // ── deleteNote ─────────────────────────────────────────────────────────────
  describe('deleteNote', () => {
    it('returns 200 with success message on soft delete', async () => {
      sandbox.stub(noteService, 'softDeleteNote').resolves({ success: true });

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.deleteNote(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(res.json.firstCall.args[0].success).to.be.true;
    });
  });

  // ── restoreNote ────────────────────────────────────────────────────────────
  describe('restoreNote', () => {
    it('returns 200 with restored note', async () => {
      sandbox.stub(noteService, 'restoreNote').resolves(fakeNote);

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.restoreNote(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(res.json.firstCall.args[0].data.note).to.deep.equal(fakeNote);
    });
  });

  // ── toggleArchive ──────────────────────────────────────────────────────────
  describe('toggleArchive', () => {
    it('returns 200 with archived note and correct message', async () => {
      sandbox.stub(noteService, 'toggleArchive').resolves({ ...fakeNote, isArchived: true });

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.toggleArchive(req, res, next);

      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.be.true;
      expect(payload.data.isArchived).to.be.true;
    });

    it('returns unarchived message when note was archived', async () => {
      sandbox.stub(noteService, 'toggleArchive').resolves({ ...fakeNote, isArchived: false });

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.toggleArchive(req, res, next);

      const payload = res.json.firstCall.args[0];
      expect(payload.data.isArchived).to.be.false;
    });
  });

  // ── togglePin ─────────────────────────────────────────────────────────────
  describe('togglePin', () => {
    it('returns 200 with pinned status true', async () => {
      sandbox.stub(noteService, 'togglePin').resolves({ ...fakeNote, isPinned: true });

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.togglePin(req, res, next);

      const payload = res.json.firstCall.args[0];
      expect(payload.data.isPinned).to.be.true;
    });
  });

  // ── addTags ────────────────────────────────────────────────────────────────
  describe('addTags', () => {
    it('returns 200 with updated tags', async () => {
      const updated = { ...fakeNote, tags: ['work', 'new'] };
      sandbox.stub(noteService, 'addTags').resolves(updated);

      const req = makeReq({ body: { tags: ['new'] } });
      const res = makeRes();
      const next = makeNext();

      await noteController.addTags(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(res.json.firstCall.args[0].data.note.tags).to.include('new');
    });
  });

  // ── removeTags ─────────────────────────────────────────────────────────────
  describe('removeTags', () => {
    it('returns 200 with tags removed', async () => {
      const updated = { ...fakeNote, tags: [] };
      sandbox.stub(noteService, 'removeTags').resolves(updated);

      const req = makeReq({ body: { tags: ['test'] } });
      const res = makeRes();
      const next = makeNext();

      await noteController.removeTags(req, res, next);

      expect(res.status.calledWith(HTTP_STATUS.OK)).to.be.true;
      expect(res.json.firstCall.args[0].data.note.tags).to.deep.equal([]);
    });
  });

  // ── getNoteStats ───────────────────────────────────────────────────────────
  describe('getNoteStats', () => {
    it('returns 200 with stats object', async () => {
      const stats = { total: 10, active: 8, deleted: 2, pinned: 1 };
      sandbox.stub(noteService, 'getNoteStats').resolves(stats);

      const req = makeReq();
      const res = makeRes();
      const next = makeNext();

      await noteController.getNoteStats(req, res, next);

      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.be.true;
      expect(payload.data.stats).to.deep.equal(stats);
    });
  });

  // ── getAllVoiceNotes ────────────────────────────────────────────────────────
  describe('getAllVoiceNotes', () => {
    it('returns 200 with only voice/mixed notes', async () => {
      const voiceNote = { ...fakeNote, inputMethod: 'voice' };
      const result = {
        notes: [voiceNote],
        pagination: { currentPage: 1, totalPages: 1, totalNotes: 1, pageSize: 10 },
      };
      sandbox.stub(noteService, 'getAllVoiceNotes').resolves(result);

      const req = makeReq({ query: {} });
      const res = makeRes();
      const next = makeNext();

      await noteController.getAllVoiceNotes(req, res, next);

      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.be.true;
      expect(payload.data.notes[0].inputMethod).to.equal('voice');
    });
  });
});
