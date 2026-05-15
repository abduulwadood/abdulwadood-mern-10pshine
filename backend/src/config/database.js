'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');
const { MESSAGES, DB_CONSTANTS } = require('./constants');

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Resolve the MongoDB connection string for the current environment.
 * The test environment uses a separate database so suites never touch dev data.
 * @returns {string}
 */
function getMongoUri() {
  if (NODE_ENV === 'test') {
    return (
      process.env.MONGODB_URI_TEST ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/notes_app_test'
    );
  }
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/notes_app';
}

const connectionOptions = {
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || DB_CONSTANTS.MAX_POOL_SIZE,
  serverSelectionTimeoutMS:
    parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT, 10) || DB_CONSTANTS.CONNECTION_TIMEOUT,
  socketTimeoutMS:
    parseInt(process.env.MONGODB_SOCKET_TIMEOUT, 10) || DB_CONSTANTS.SOCKET_TIMEOUT,
};

const READY_STATE = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let eventsBound = false;
let hasConnectedOnce = false;

/**
 * Attach connection lifecycle listeners exactly once.
 * Bound lazily so requiring this module never opens a socket.
 *
 * Before the first successful connection, `error`/`disconnected` events are
 * logged at debug only: the initial-connect failure is already surfaced once
 * by the caller as a single "degraded mode" WARN, so emitting ERROR/WARN here
 * too would just be duplicate startup noise. After we have connected at least
 * once, these become genuine runtime events worth surfacing loudly.
 */
function bindConnectionEvents() {
  if (eventsBound) return;
  eventsBound = true;

  const conn = mongoose.connection;

  conn.on('connected', () => {
    hasConnectedOnce = true;
    logger.info({ host: conn.host, database: conn.name }, MESSAGES.DB_CONNECTION_SUCCESS);
  });

  conn.on('error', (err) => {
    const payload = { error: err.message || String(err) };
    if (hasConnectedOnce) {
      logger.error(payload, MESSAGES.DB_CONNECTION_FAILED);
    } else {
      logger.debug(payload, 'MongoDB connection error during initial connect');
    }
  });

  conn.on('disconnected', () => {
    if (hasConnectedOnce) {
      logger.warn('MongoDB disconnected');
    } else {
      logger.debug('MongoDB not connected (initial connect pending/failed)');
    }
  });

  conn.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
}

/**
 * Connect to MongoDB.
 *
 * Throws on failure rather than calling process.exit so the HTTP server can
 * keep running in "degraded" mode (the /api/health endpoint reports the
 * database as unavailable). This mirrors the Module 1 startup contract.
 *
 * @param {string} [uri] - Override URI (used by tests).
 * @returns {Promise<import('mongoose').Connection>}
 */
async function connectDB(uri = getMongoUri()) {
  bindConnectionEvents();
  mongoose.set('strictQuery', true);

  // Let the caller decide how to report failure. In degraded-mode startup
  // index.js logs a single WARN; re-logging an ERROR here would duplicate it.
  await mongoose.connect(uri, connectionOptions);
  return mongoose.connection;
}

/**
 * Gracefully close the MongoDB connection. Safe to call when not connected.
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}

/**
 * Human-readable connection state: connected | connecting | disconnected | disconnecting.
 * @returns {string}
 */
function getConnectionState() {
  return READY_STATE[mongoose.connection.readyState] || 'unknown';
}

/**
 * Connection metadata for the health endpoint.
 * @returns {{ state: string, name: (string|null), host: (string|null) }}
 */
function getConnectionInfo() {
  const conn = mongoose.connection;
  return {
    state: getConnectionState(),
    name: conn.name || null,
    host: conn.host || null,
  };
}

/**
 * True when the connection is live and responds to a ping.
 * Used by the health-check endpoint.
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
  try {
    if (mongoose.connection.readyState !== 1) return false;
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Ping the database and measure round-trip latency in milliseconds.
 * @returns {Promise<{ ok: boolean, responseTimeMs: number }>}
 */
async function pingDB() {
  const start = Date.now();
  const ok = await checkConnection();
  return { ok, responseTimeMs: Date.now() - start };
}

module.exports = {
  connectDB,
  disconnectDB,
  checkConnection,
  getConnectionState,
  getConnectionInfo,
  pingDB,
  getMongoUri,
  mongoose,
};
