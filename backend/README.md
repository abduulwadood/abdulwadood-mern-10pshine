# Notes App Backend

REST API backend for the Notes Application built with Node.js and Express.js.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MySQL 8 (via mysql2) |
| Logging | Pino + pino-pretty |
| Validation | Joi |
| Security | Helmet, bcryptjs, jsonwebtoken |
| Testing | Mocha + Chai + Supertest |
| Code Quality | SonarQube |

## Project Structure

```
backend/
├── src/
│   ├── config/           # database, logger, constants
│   ├── controllers/      # request handlers
│   ├── middleware/        # cors, error handler, request logger
│   ├── routes/           # Express routers
│   ├── utils/            # custom errors, response helpers, validators
│   ├── server.js         # Express app setup
│   └── index.js          # Entry point + graceful shutdown
├── test/
│   ├── fixtures/         # shared test data
│   ├── unit/             # unit tests
│   └── integration/      # integration tests
├── logs/                 # runtime log files (git-ignored)
├── .env.example          # environment variable template
└── package.json
```

## Prerequisites

- Node.js ≥ 18
- MySQL 8 (or skip DB setup — server starts in degraded mode without it)

## Installation

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env and fill in DB_USER, DB_PASSWORD, JWT_SECRET

# 4. Create the database (MySQL)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS notes_app;"
```

## Running the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts on **http://localhost:5000** (or the port set in `.env`).

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status, database connectivity, uptime, and version information.

**Response (200 — healthy)**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "healthy",
    "server": { "uptime": 42, "uptimeHuman": "0d 0h 0m 42s", ... },
    "database": { "connected": true, "host": "localhost", ... },
    "application": { "name": "Notes App Backend", "version": "1.0.0", ... }
  },
  "error": null,
  "timestamp": "2026-04-22T00:00:00.000Z"
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | — | MySQL username |
| `DB_PASSWORD` | — | MySQL password |
| `DB_NAME` | `notes_app` | Database name |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `JWT_EXPIRE` | `7d` | JWT expiry duration |
| `LOG_LEVEL` | `info` | Pino log level |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin(s) |

## Module Roadmap

| Module | Status |
|--------|--------|
| Module 1: Project Setup & Configuration | ✅ Complete |
| Module 2: User Authentication | Pending |
| Module 3: Notes CRUD | Pending |
| Module 4–8 | Pending |

## Contributing

1. Branch from `develop`
2. Write tests for any new feature
3. Ensure `npm test` passes before opening a PR
4. Follow the existing code style (ES6+, async/await)
