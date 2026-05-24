'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';

const { expect } = require('chai');
const supertest = require('supertest');

const db = require('../helpers/db');
const { User } = require('../../src/models');
const Note = require('../../src/models/Note');
const { generateTokenPair } = require('../../src/utils/jwtUtils');
const app = require('../../src/server');
const {
  validTypedNote,
  validVoiceNote,
  validUrduVoiceNote,
  validVoiceUpdate,
} = require('../fixtures/testData');

const request = supertest(app);

let accessToken;
let userId;
let otherToken;
let otherUserId;

async function createNote(data, token = accessToken) {
  return request
    .post('/api/notes')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
}

async function seedNote(data, uid = userId) {
  return Note.create({ ...data, userId: uid });
}

describe('Integration: Notes API', () => {
  before(async function setup() {
    this.timeout(120000);
    await db.connect();
    await User.init();
    await Note.init();

    // Create primary test user
    const user = await User.create({
      username: 'noteuser',
      email: 'noteuser@example.com',
      password: 'TestPass123!',
      firstName: 'Note',
      lastName: 'User',
      isEmailVerified: true,
    });
    userId = user._id;
    accessToken = generateTokenPair({
      id: userId.toString(),
      username: user.username,
      email: user.email,
    }).accessToken;

    // Create secondary user for authorization tests
    const other = await User.create({
      username: 'otheruser',
      email: 'otheruser@example.com',
      password: 'TestPass123!',
      firstName: 'Other',
      lastName: 'User',
      isEmailVerified: true,
    });
    otherUserId = other._id;
    otherToken = generateTokenPair({
      id: otherUserId.toString(),
      username: other.username,
      email: other.email,
    }).accessToken;
  });

  after(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    await Note.deleteMany({}).setOptions({ withDeleted: true });
  });

  // ── Create typed note ─────────────────────────────────────────────────────
  describe('POST /api/notes — typed note', () => {
    it('creates a typed note and returns 201', async () => {
      const res = await createNote(validTypedNote);
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data.note.title).to.equal(validTypedNote.title);
      expect(res.body.data.note.inputMethod).to.equal('typed');
    });

    it('auto-calculates wordCount and characterCount', async () => {
      const res = await createNote(validTypedNote);
      expect(res.body.data.note.wordCount).to.be.above(0);
      expect(res.body.data.note.characterCount).to.be.above(0);
    });

    it('returns 400 for missing title', async () => {
      const res = await createNote({ content: 'No title' });
      expect(res.status).to.equal(400);
    });

    it('returns 400 for missing content', async () => {
      const res = await createNote({ title: 'No content' });
      expect(res.status).to.equal(400);
    });

    it('returns 401 without token', async () => {
      const res = await request.post('/api/notes').send(validTypedNote);
      expect(res.status).to.equal(401);
    });
  });

  // ── Create voice note (English) ───────────────────────────────────────────
  describe('POST /api/notes/voice — English voice note', () => {
    it('creates a voice note with voiceLanguage en-US and returns 201', async () => {
      const res = await request
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validVoiceNote);
      expect(res.status).to.equal(201);
      expect(res.body.data.note.inputMethod).to.equal('voice');
      expect(res.body.data.note.voiceLanguage).to.equal('en-US');
    });

    it('stores language display name in voiceMetadata', async () => {
      const res = await request
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validVoiceNote);
      expect(res.body.data.note.voiceMetadata.languageName).to.equal('English');
    });
  });

  // ── Create voice note (Urdu) ──────────────────────────────────────────────
  describe('POST /api/notes/voice — Urdu voice note', () => {
    it('creates a voice note with Urdu text and returns 201', async () => {
      const res = await request
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validUrduVoiceNote);
      expect(res.status).to.equal(201);
      expect(res.body.data.note.voiceLanguage).to.equal('ur-PK');
      expect(res.body.data.note.voiceMetadata.languageName).to.equal('Urdu');
      expect(res.body.data.note.content).to.equal(validUrduVoiceNote.content);
    });
  });

  // ── Get all notes with pagination ─────────────────────────────────────────
  describe('GET /api/notes — pagination', () => {
    beforeEach(async () => {
      await Promise.all([
        seedNote({ title: 'Note 1', content: 'Content 1' }),
        seedNote({ title: 'Note 2', content: 'Content 2' }),
        seedNote({ title: 'Note 3', content: 'Content 3' }),
      ]);
    });

    it('returns paginated notes with correct metadata', async () => {
      const res = await request
        .get('/api/notes?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data.notes).to.have.length(2);
      expect(res.body.data.pagination.totalNotes).to.equal(3);
      expect(res.body.data.pagination.hasNextPage).to.be.true;
    });

    it('returns second page correctly', async () => {
      const res = await request
        .get('/api/notes?page=2&limit=2')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.body.data.notes).to.have.length(1);
      expect(res.body.data.pagination.hasPrevPage).to.be.true;
    });

    it('does not return other users notes', async () => {
      await seedNote({ title: 'Other note', content: 'Content' }, otherUserId);
      const res = await request
        .get('/api/notes')
        .set('Authorization', `Bearer ${accessToken}`);
      const titles = res.body.data.notes.map((n) => n.title);
      expect(titles).to.not.include('Other note');
    });
  });

  // ── Get single note ───────────────────────────────────────────────────────
  describe('GET /api/notes/:id', () => {
    it('returns the correct note', async () => {
      const note = await seedNote(validTypedNote);
      const res = await request
        .get(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data.note.title).to.equal(validTypedNote.title);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request
        .get('/api/notes/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(404);
    });

    it('returns 404 when accessing another user note', async () => {
      const note = await seedNote(validTypedNote, otherUserId);
      const res = await request
        .get(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.be.oneOf([403, 404]);
    });
  });

  // ── Update note ───────────────────────────────────────────────────────────
  describe('PUT /api/notes/:id', () => {
    it('updates title and content', async () => {
      const note = await seedNote(validTypedNote);
      const res = await request
        .put(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title', content: 'Updated content here.' });
      expect(res.status).to.equal(200);
      expect(res.body.data.note.title).to.equal('Updated Title');
    });

    it('recalculates wordCount after content update', async () => {
      const note = await seedNote(validTypedNote);
      const res = await request
        .put(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'T', content: 'one two three four five' });
      expect(res.body.data.note.wordCount).to.equal(5);
    });
  });

  // ── Update note with voice ────────────────────────────────────────────────
  describe('PUT /api/notes/:id/voice', () => {
    it('replaces content and sets inputMethod to mixed for a typed note', async () => {
      const note = await seedNote(validTypedNote);
      const res = await request
        .put(`/api/notes/${note._id}/voice`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validVoiceUpdate);
      expect(res.status).to.equal(200);
      expect(res.body.data.note.content).to.equal(validVoiceUpdate.content);
      expect(res.body.data.note.inputMethod).to.equal('mixed');
    });

    it('appends content when appendToExisting is true', async () => {
      const note = await seedNote({ title: 'T', content: 'original' });
      const res = await request
        .put(`/api/notes/${note._id}/voice`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validVoiceUpdate, appendToExisting: true });
      expect(res.body.data.note.content).to.include('original');
      expect(res.body.data.note.content).to.include(validVoiceUpdate.content);
    });

    it('increments voiceEditCount', async () => {
      const note = await seedNote(validTypedNote);
      await request
        .put(`/api/notes/${note._id}/voice`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validVoiceUpdate);
      const res = await request
        .put(`/api/notes/${note._id}/voice`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validVoiceUpdate);
      expect(res.body.data.note.voiceMetadata.voiceEditCount).to.equal(2);
    });
  });

  // ── Soft delete ───────────────────────────────────────────────────────────
  describe('DELETE /api/notes/:id — soft delete', () => {
    it('soft deletes a note and it no longer appears in list', async () => {
      const note = await seedNote(validTypedNote);
      const del = await request
        .delete(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(del.status).to.equal(200);

      const list = await request
        .get('/api/notes')
        .set('Authorization', `Bearer ${accessToken}`);
      const ids = list.body.data.notes.map((n) => n._id.toString());
      expect(ids).to.not.include(note._id.toString());
    });
  });

  // ── Restore deleted note ──────────────────────────────────────────────────
  describe('PATCH /api/notes/:id/restore', () => {
    it('restores a soft-deleted note so it appears in queries again', async () => {
      const note = await seedNote(validTypedNote);
      await request
        .delete(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request
        .patch(`/api/notes/${note._id}/restore`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);

      const list = await request
        .get('/api/notes')
        .set('Authorization', `Bearer ${accessToken}`);
      const ids = list.body.data.notes.map((n) => n._id.toString());
      expect(ids).to.include(note._id.toString());
    });
  });

  // ── Toggle archive ────────────────────────────────────────────────────────
  describe('PATCH /api/notes/:id/archive', () => {
    it('archives a note and toggles back', async () => {
      const note = await seedNote(validTypedNote);

      const archive = await request
        .patch(`/api/notes/${note._id}/archive`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(archive.status).to.equal(200);
      expect(archive.body.data.isArchived).to.be.true;

      const unarchive = await request
        .patch(`/api/notes/${note._id}/archive`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(unarchive.body.data.isArchived).to.be.false;
    });
  });

  // ── Toggle pin ────────────────────────────────────────────────────────────
  describe('PATCH /api/notes/:id/pin', () => {
    it('pins a note and pinned notes appear first in default sort', async () => {
      const n1 = await seedNote({ title: 'Unpinned', content: 'Content' });
      const n2 = await seedNote({ title: 'Pinned', content: 'Content', isPinned: false });

      await request
        .patch(`/api/notes/${n2._id}/pin`)
        .set('Authorization', `Bearer ${accessToken}`);

      const list = await request
        .get('/api/notes')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(list.body.data.notes[0].title).to.equal('Pinned');
    });
  });

  // ── Add and remove tags ───────────────────────────────────────────────────
  describe('POST & DELETE /api/notes/:id/tags', () => {
    it('adds tags without duplicates', async () => {
      const note = await seedNote(validTypedNote); // already has ['test','sample']
      const res = await request
        .post(`/api/notes/${note._id}/tags`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags: ['work', 'test'] }); // 'test' is duplicate
      expect(res.status).to.equal(200);
      const tags = res.body.data.note.tags;
      expect(tags).to.include('work');
      expect(tags.filter((t) => t === 'test')).to.have.length(1);
    });

    it('returns 400 when total tags would exceed limit', async () => {
      const note = await seedNote({
        title: 'T',
        content: 'C',
        tags: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10'],
      });
      const res = await request
        .post(`/api/notes/${note._id}/tags`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags: ['new'] });
      expect(res.status).to.equal(400);
    });

    it('removes specified tags', async () => {
      const note = await seedNote(validTypedNote); // tags: ['test','sample']
      const res = await request
        .delete(`/api/notes/${note._id}/tags`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags: ['test'] });
      expect(res.status).to.equal(200);
      expect(res.body.data.note.tags).to.not.include('test');
      expect(res.body.data.note.tags).to.include('sample');
    });
  });

  // ── Get voice notes ───────────────────────────────────────────────────────
  describe('GET /api/notes/voice/all', () => {
    it('returns only voice and mixed notes', async () => {
      await seedNote(validTypedNote); // typed
      await seedNote({ ...validVoiceNote, userId }); // voice — need to set explicitly
      // Create voice note via service path to properly set inputMethod
      await Note.create({ title: 'VN', content: 'VC', userId, inputMethod: 'voice', voiceLanguage: 'en-US' });

      const res = await request
        .get('/api/notes/voice/all')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      res.body.data.notes.forEach((n) => {
        expect(['voice', 'mixed']).to.include(n.inputMethod);
      });
    });
  });

  // ── Get notes stats ───────────────────────────────────────────────────────
  describe('GET /api/notes/stats', () => {
    it('returns accurate note counts', async () => {
      await seedNote(validTypedNote);
      await Note.create({ title: 'VN', content: 'VC', userId, inputMethod: 'voice', voiceLanguage: 'en-US' });

      const res = await request
        .get('/api/notes/stats')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      const { stats } = res.body.data;
      expect(stats.total).to.equal(2);
      expect(stats.byInputMethod.typed).to.equal(1);
      expect(stats.byInputMethod.voice).to.equal(1);
    });
  });

  // ── Search notes ──────────────────────────────────────────────────────────
  describe('GET /api/notes?search=...', () => {
    it('returns notes matching the search term', async () => {
      await seedNote({ title: 'MongoDB Guide', content: 'All about aggregations' });
      await seedNote({ title: 'Express Tips', content: 'Middleware patterns' });

      const res = await request
        .get('/api/notes?search=aggregations')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      const titles = res.body.data.notes.map((n) => n.title);
      expect(titles).to.include('MongoDB Guide');
    });
  });

  // ── Filter by inputMethod ─────────────────────────────────────────────────
  describe('GET /api/notes?inputMethod=voice', () => {
    it('returns only notes with matching inputMethod', async () => {
      await seedNote(validTypedNote);
      await Note.create({ title: 'VN', content: 'VC', userId, inputMethod: 'voice', voiceLanguage: 'en-US' });

      const res = await request
        .get('/api/notes?inputMethod=voice')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      res.body.data.notes.forEach((n) => {
        expect(n.inputMethod).to.equal('voice');
      });
    });
  });

  // ── Authorization ─────────────────────────────────────────────────────────
  describe('Authorization: users cannot modify each others notes', () => {
    it('returns 403/404 when updating another users note', async () => {
      const note = await seedNote(validTypedNote, otherUserId);
      const res = await request
        .put(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Hijack' });
      expect(res.status).to.be.oneOf([403, 404]);
    });

    it('returns 403/404 when deleting another users note', async () => {
      const note = await seedNote(validTypedNote, otherUserId);
      const res = await request
        .delete(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.be.oneOf([403, 404]);
    });
  });

  // ── Permanent delete ──────────────────────────────────────────────────────
  describe('DELETE /api/notes/:id/permanent', () => {
    it('permanently deletes a soft-deleted note', async () => {
      const note = await seedNote(validTypedNote);
      await request
        .delete(`/api/notes/${note._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request
        .delete(`/api/notes/${note._id}/permanent`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);

      const inDB = await Note.findById(note._id).setOptions({ withDeleted: true });
      expect(inDB).to.be.null;
    });

    it('returns 400 if note is not yet soft-deleted', async () => {
      const note = await seedNote(validTypedNote);
      const res = await request
        .delete(`/api/notes/${note._id}/permanent`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(400);
    });
  });

  // ── Get all tags ──────────────────────────────────────────────────────────
  describe('GET /api/notes/tags/all', () => {
    it('returns unique tags with frequency counts', async () => {
      await seedNote({ title: 'N1', content: 'C', tags: ['work', 'todo'] });
      await seedNote({ title: 'N2', content: 'C', tags: ['work', 'ideas'] });

      const res = await request
        .get('/api/notes/tags/all')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).to.equal(200);
      const tags = res.body.data.tags;
      const workTag = tags.find((t) => t.tag === 'work');
      expect(workTag).to.exist;
      expect(workTag.count).to.equal(2);
    });
  });
});
