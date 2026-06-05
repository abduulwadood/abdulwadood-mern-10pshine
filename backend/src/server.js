'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
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
const exportImportRouter = require('./routes/exportImportRoutes');
const noteRouter = require('./routes/noteRoutes');
const imageRouter = require('./routes/imageRoutes');
const commentRouter = require('./routes/commentRoutes');
const logger = require('./config/logger');

// Ensure uploads directory exists at startup
const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

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

// ── Static file serving (before routes) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res) => {
    // Allow cross-origin image loading from the frontend dev server
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
// export/import must be mounted before noteRouter to avoid /:id capturing /export and /import
app.use('/api/notes', exportImportRouter);
app.use('/api/notes', noteRouter);
app.use('/api/images', imageRouter);
app.use('/api/notes/:noteId/comments', commentRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
