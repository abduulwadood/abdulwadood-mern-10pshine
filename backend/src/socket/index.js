'use strict';

const { socketAuthMiddleware } = require('./authSocket');
const { registerNoteSocketEvents } = require('./noteSocket');
const logger = require('../config/logger');

function setupSocketHandlers(io) {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(
      { userId: socket.userId, socketId: socket.id },
      'New socket connection established'
    );

    registerNoteSocketEvents(io, socket);

    socket.emit('connected', {
      message: 'Real-time connection established',
      userId: socket.userId,
      socketId: socket.id,
    });
  });

  io.on('error', (error) => {
    logger.error({ error: error.message }, 'Socket.IO error');
  });
}

module.exports = { setupSocketHandlers };
