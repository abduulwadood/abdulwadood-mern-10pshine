'use strict';

const logger = require('../config/logger');

function registerNoteSocketEvents(io, socket) {
  const userId = socket.userId;

  socket.join(`user:${userId}`);
  logger.info({ userId }, 'User joined personal socket room');

  socket.on('note:typing', ({ noteId }) => {
    socket.to(`user:${userId}`).emit('note:typing', {
      noteId,
      userId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('note:stopTyping', ({ noteId }) => {
    socket.to(`user:${userId}`).emit('note:stopTyping', {
      noteId,
      userId,
    });
  });

  socket.on('disconnect', (reason) => {
    logger.info({ userId, reason }, 'Socket disconnected');
  });
}

function emitNoteEvent(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
  logger.debug({ userId, event }, 'Socket event emitted');
}

module.exports = { registerNoteSocketEvents, emitNoteEvent };
