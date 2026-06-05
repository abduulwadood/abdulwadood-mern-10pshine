'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./server');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { initSocket } = require('./config/socket');
const { setupSocketHandlers } = require('./socket');
const { MESSAGES } = require('./config/constants');

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Create HTTP server and attach Socket.IO before listening
const httpServer = http.createServer(app);
const io = initSocket(httpServer);
setupSocketHandlers(io);
app.set('io', io);

let server;

async function startServer() {
  try {
    server = httpServer.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          env: process.env.NODE_ENV,
          url: process.env.SERVER_URL || `http://localhost:${PORT}`,
        },
        MESSAGES.SERVER_STARTED
      );

      // Attempt DB connection in the background (single try, no retry spam).
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

process.on('unhandledRejection', (reason) => {
  logger.error({ reason: String(reason) }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception — shutting down');
  process.exit(1);
});

startServer();
