'use strict';

const cors = require('cors');

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const allowedOrigins = CORS_ORIGIN.split(',').map((o) => o.trim());

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,       // Allow cookies / Authorization headers
  optionsSuccessStatus: 204,
  maxAge: 600,             // Cache preflight for 10 minutes
};

module.exports = cors(corsOptions);
