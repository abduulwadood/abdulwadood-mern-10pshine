# Server Startup Guide

Quick reference for getting the Notes App backend running locally.

## Step-by-Step Setup

### 1. Install Node.js dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and update:
- `DB_USER` — your MySQL username (default: `root`)
- `DB_PASSWORD` — your MySQL password
- `JWT_SECRET` — any long random string (min 32 characters)

### 3. Create the MySQL database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS notes_app;
EXIT;
```

If you do not have MySQL installed, the server will still start but the
`/api/health` endpoint will report `"status": "degraded"`.

### 4. Start the development server

```bash
npm run dev
```

Expected output:
```
[INFO] Server started successfully  { port: 5000, env: 'development', url: 'http://localhost:5000' }
[INFO] Database connection established  { host: 'localhost', database: 'notes_app' }
```

### 5. Verify the server is running

```bash
curl http://localhost:5000/api/health
```

Or open **http://localhost:5000/api/health** in your browser.

### 6. Run the tests

```bash
npm test
```

---

## Common Issues

### Port already in use

```
Error: listen EADDRINUSE :::5000
```

Kill the process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS / Linux
lsof -i :5000
kill -9 <PID>
```

Or change `PORT` in `.env`.

### Cannot connect to MySQL

- Check MySQL is running: `mysql -u root -p`
- Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env`
- The server will start in degraded mode without a DB — only the health
  endpoint will report `connected: false`

### Module not found errors

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start in production mode |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with Istanbul coverage report |
| `npm run test:watch` | Re-run tests on file change |
