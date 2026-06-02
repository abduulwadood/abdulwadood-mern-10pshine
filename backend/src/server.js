'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const cookieParser = require('cookie-parser');
const corsMiddleware = require('./middleware/corsConfig');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/healthCheck');
const authRouter = require('./routes/authRoutes');
const noteRouter = require('./routes/noteRoutes');
const logger = require('./config/logger');

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookie parsing ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP request logging (morgan → pino) ────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// ── Structured request / response logger ────────────────────────────────────
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/notes', noteRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
