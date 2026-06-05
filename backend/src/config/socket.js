'use strict';

const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  logger.info('Socket.IO initialized');
  return io;
}

// Returns null if not initialized — callers must guard with: if (io) emitNoteEvent(...)
function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
