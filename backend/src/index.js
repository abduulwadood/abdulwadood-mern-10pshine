'use strict';

require('dotenv').config();

const app = require('./server');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { MESSAGES } = require('./config/constants');

const PORT = parseInt(process.env.PORT, 10) || 5000;

let server;

async function startServer() {
  try {
    // Start the HTTP server immediately so the process is ready to accept traffic.
    server = app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          env: process.env.NODE_ENV,
          url: process.env.SERVER_URL || `http://localhost:${PORT}`,
        },
        MESSAGES.SERVER_STARTED
      );

      // Attempt DB connection in the background (single try, no retry spam).
      // The /api/health endpoint reports "degraded" until the DB comes up.
      connectDB().catch((dbError) => {
        logger.warn(
          { error: dbError.sqlMessage || dbError.message || dbError.code || String(dbError) },
          'Database unavailable - server running in degraded mode'
        );
      });
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.fatal({ port: PORT }, `Port ${PORT} is already in use`);
      } else {
        logger.fatal({ error: error.message }, 'Server error');
      }
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error: error.message, stack: error.stack }, 'Failed to start server');
    process.exit(1);
  }
}

// ── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received — closing gracefully');

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      logger.info(MESSAGES.SERVER_STOPPED);
      process.exit(0);
    });

    // Force exit if graceful shutdown takes longer than 10 s
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejections & exceptions ────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  logger.error({ reason: String(reason) }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception — shutting down');
  process.exit(1);
});

startServer();
