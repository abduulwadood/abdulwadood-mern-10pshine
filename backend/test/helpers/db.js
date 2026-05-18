'use strict';

// All model / integration suites talk to an ephemeral in-memory MongoDB so
// they are fully self-contained (no local mongod required). The first run
// downloads a MongoDB binary into the mongodb-memory-server cache.

process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');

let mongod = null;

/**
 * Boot an in-memory MongoDB and connect mongoose to it.
 * @returns {Promise<string>} the connection URI
 */
async function connect() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return uri;
}

/**
 * Wipe every collection between tests for isolation.
 */
async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) return;
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

/**
 * Drop the database, disconnect, and stop the in-memory server.
 */
async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

module.exports = { connect, clearDatabase, closeDatabase, mongoose };
