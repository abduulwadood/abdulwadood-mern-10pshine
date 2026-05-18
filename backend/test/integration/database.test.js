'use strict';

process.env.NODE_ENV = 'test';
// Keep server-selection short so the invalid-URI test fails fast.
process.env.MONGODB_SERVER_SELECTION_TIMEOUT = '2000';

const { expect } = require('chai');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  connectDB,
  disconnectDB,
  checkConnection,
  getConnectionState,
  mongoose,
} = require('../../src/config/database');
const { User, Note } = require('../../src/models');

let mongod;
let mongoUri;

describe('Integration: Database', () => {
  before(async function setup() {
    this.timeout(120000); // first run downloads the in-memory mongo binary
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await connectDB(mongoUri);
    await User.init();
    await Note.init();
  });

  after(async () => {
    await disconnectDB().catch(() => {});
    if (mongod) await mongod.stop();
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Note.deleteMany({});
    }
  });

  // ── Connection ─────────────────────────────────────────────────────────────
  describe('Connection', () => {
    it('is connected after connectDB (readyState 1)', () => {
      expect(mongoose.connection.readyState).to.equal(1);
      expect(getConnectionState()).to.equal('connected');
    });

    it('responds to a ping via checkConnection', async () => {
      expect(await checkConnection()).to.be.true;
    });

    it('rejects an invalid connection URI', async function invalidUri() {
      this.timeout(15000);
      await disconnectDB();
      let threw = false;
      try {
        await connectDB('mongodb://127.0.0.1:65535/nope');
      } catch {
        threw = true;
      }
      expect(threw).to.be.true;
      await connectDB(mongoUri); // restore for remaining tests
    });

    it('disconnects gracefully', async () => {
      await disconnectDB();
      expect(mongoose.connection.readyState).to.equal(0);
      await connectDB(mongoUri); // restore for remaining tests
    });
  });

  // ── User CRUD ──────────────────────────────────────────────────────────────
  describe('User CRUD', () => {
    const sample = {
      username: 'dbuser',
      email: 'dbuser@example.com',
      password: 'TestPass123!',
    };

    it('creates and persists a user', async () => {
      const user = await User.create(sample);
      const found = await User.findById(user._id);
      expect(found).to.exist;
      expect(found.email).to.equal('dbuser@example.com');
    });

    it('finds a user by email', async () => {
      await User.create(sample);
      const found = await User.findByEmail('dbuser@example.com');
      expect(found).to.exist;
    });

    it('updates user fields', async () => {
      const user = await User.create(sample);
      user.firstName = 'Updated';
      await user.save();
      const found = await User.findById(user._id);
      expect(found.firstName).to.equal('Updated');
    });

    it('enforces a unique email at the database level', async () => {
      await User.create(sample);
      try {
        await User.create({ ...sample, username: 'other' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });

    it('enforces a unique username at the database level', async () => {
      await User.create(sample);
      try {
        await User.create({ ...sample, email: 'another@example.com' });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });
  });

  // ── Note CRUD ──────────────────────────────────────────────────────────────
  describe('Note CRUD', () => {
    it('creates and persists a note linked to a user', async () => {
      const user = await User.create({
        username: 'noteowner',
        email: 'noteowner@example.com',
        password: 'TestPass123!',
      });
      const note = await Note.create({
        title: 'Persisted',
        content: 'body',
        userId: user._id,
      });
      const found = await Note.findById(note._id);
      expect(found).to.exist;
      expect(String(found.userId)).to.equal(String(user._id));
    });

    it('finds notes by userId', async () => {
      const uid = new mongoose.Types.ObjectId();
      await Note.create({ title: 'A', content: 'a', userId: uid });
      await Note.create({ title: 'B', content: 'b', userId: uid });
      const result = await Note.findByUser(uid);
      expect(result.docs).to.have.lengthOf(2);
    });

    it('does not return soft-deleted notes in regular queries', async () => {
      const uid = new mongoose.Types.ObjectId();
      const note = await Note.create({ title: 'Doomed', content: 'x', userId: uid });
      await note.softDelete();
      const all = await Note.find({ userId: uid });
      expect(all).to.have.lengthOf(0);
    });
  });

  // ── Health ─────────────────────────────────────────────────────────────────
  describe('Database health', () => {
    it('reports a connected state', async () => {
      expect(await checkConnection()).to.be.true;
      expect(getConnectionState()).to.equal('connected');
    });
  });
});
