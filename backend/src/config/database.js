'use strict';

const mysql = require('mysql2/promise');
const logger = require('./logger');
const { MESSAGES, TIMEOUTS, DB } = require('./constants');

let pool = null;
let retryCount = 0;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'notes_app',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || DB.MAX_POOL,
  queueLimit: 0,
  connectTimeout: TIMEOUTS.DB_CONNECT,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

/**
 * Extract a readable reason from a mysql2 / Node.js network error.
 * mysql2 often leaves message empty and puts the reason in .code or .sqlMessage.
 */
function errorReason(err) {
  return err.sqlMessage || err.message || err.code || String(err);
}

/**
 * Create the connection pool. Called once at startup.
 */
function createPool() {
  pool = mysql.createPool(dbConfig);

  pool.on('connection', (connection) => {
    logger.debug({ threadId: connection.threadId }, 'New DB connection acquired');
  });

  pool.on('enqueue', () => {
    logger.warn('Waiting for available DB connection in pool');
  });

  return pool;
}

/**
 * Try to connect once without retrying.
 * Used for background / degraded-mode startup so the console stays quiet.
 * @returns {Promise<object>} pool on success, throws on failure.
 */
async function connect() {
  if (!pool) createPool();

  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();

  logger.info({ host: dbConfig.host, database: dbConfig.database }, MESSAGES.DB_CONNECTION_SUCCESS);
  return pool;
}

/**
 * Test connectivity with exponential back-off retry.
 * Use this for production startup where a brief DB unavailability is expected.
 */
async function connectWithRetry() {
  try {
    return await connect();
  } catch (error) {
    retryCount += 1;

    if (retryCount <= TIMEOUTS.DB_MAX_RETRIES) {
      const delay = TIMEOUTS.DB_RETRY_INTERVAL * retryCount;
      logger.warn(
        {
          attempt: retryCount,
          maxRetries: TIMEOUTS.DB_MAX_RETRIES,
          retryInMs: delay,
          error: errorReason(error),
        },
        'DB connection failed - retrying'
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectWithRetry();
    }

    logger.error({ error: errorReason(error) }, MESSAGES.DB_CONNECTION_FAILED);
    throw error;
  }
}

/**
 * Execute a parameterised query against the pool.
 */
async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool not initialised. Call connect() first.');
  }

  const start = Date.now();
  try {
    const [rows] = await pool.execute(sql, params);
    logger.debug({ sql, durationMs: Date.now() - start }, 'Query executed');
    return rows;
  } catch (error) {
    logger.error({ sql, error: errorReason(error) }, 'Query failed');
    throw error;
  }
}

/**
 * Gracefully close all connections in the pool.
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

/**
 * Ping the DB - used by the health-check endpoint.
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
  try {
    if (!pool) return false;
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch {
    return false;
  }
}

function getPool() {
  return pool;
}

module.exports = {
  connect,
  connectWithRetry,
  query,
  closePool,
  checkConnection,
  getPool,
};
