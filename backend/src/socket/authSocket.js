'use strict';

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      logger.warn('Socket connection rejected - no token');
      return next(new Error('Authentication required'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = String(decoded.id || decoded._id);
    socket.userEmail = decoded.email;
    logger.info({ userId: socket.userId }, 'Socket authenticated successfully');
    next();
  } catch (error) {
    logger.warn({ error: error.message }, 'Socket authentication failed');
    next(new Error('Invalid token'));
  }
}

module.exports = { socketAuthMiddleware };
