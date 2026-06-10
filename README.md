# 10 Pearls MERN Internship Project
# 📝 Notes App — Full Stack MERN Application

<div align="center">

![Notes App](https://img.shields.io/badge/Notes-App-6366f1?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-00d084?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

A production-ready, full-stack Notes Application built with the MERN stack featuring voice-to-text input, real-time updates, image embedding, rich text editing, and enterprise-grade backend architecture.

**Built as part of the [10Pearls Shine Internship Program](https://www.10pearls.com/shine)**

</div>

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with access tokens (15min) and refresh tokens (7 days)
- OTP email verification on registration (6-digit, 10-min expiry, 3 attempt limit)
- Account lockout after 5 failed login attempts (2-hour cooldown)
- Bcrypt password hashing with secure change-password flow
- HTTP-only cookie refresh token storage

### 📝 Notes Management
- Create, read, update, delete notes with rich text (TipTap editor)
- Pin notes to the top of the dashboard
- Archive and restore notes
- Soft delete with trash support
- Color-coded notes (6 color options)
- Tag-based organization with filtering
- Full-text search across all notes
- Pagination with sorting options

### 🎤 Voice Input
- Voice-to-text note creation using Web Speech API
- Supports **English (en-US)** and **Urdu (ur-PK)**
- Three input methods: Typed, Voice, Mixed
- RTL text direction for Urdu notes
- Continuous recording mode (up to 5 minutes)
- Live transcript display while recording

### 🖼️ Image Support
- Inline image upload directly in the editor
- Client-side compression (canvas API, max 1200px, 75% quality)
- Resizable images with drag handles in the editor
- Alignment toolbar (Left / Center / Right)
- Size presets (S / M / L)
- Images stored as base64 in note content

### ⚡ Real-time Updates
- Socket.IO integration for live note synchronization
- Notes update across tabs without page refresh
- Per-user isolated rooms (user:${id})
- Live connection status indicator (green pulsing dot)
- Typing indicators in the editor
- Auto-reconnect on network drops

### 📤 Export & Import
- Export all notes as **JSON** (re-importable) or **Plain Text**
- Export a single specific note from the reader view
- Import notes from a previously exported JSON file
- Drag-and-drop import with file validation
- Import result summary (imported / total / skipped)

### 🎨 Rich Text Editor (TipTap)
- Bold, italic, headings (H1/H2/H3)
- Bullet lists, ordered lists
- Blockquotes, inline code, code blocks
- Image upload and resizing
- Character count (50,000 limit)
- Auto-save draft to localStorage
- Word count and reading time in footer

### 👤 User Profile
- View and edit profile (first name, last name)
- Note statistics (typed / voice / mixed breakdown)
- Secure password change with re-login enforcement
- Account information display

### 🔍 Backend Quality
- **Advanced Pino logging** — structured JSON logs, request correlation IDs, response timing
- **10 custom error classes** — ValidationError, AuthError, NotFoundError, etc.
- **Global error handler** — consistent error response format across all endpoints
- **70%+ unit test coverage** — Mocha/Chai/Sinon test suite
- **SonarQube A-rated** — zero bugs, zero vulnerabilities, ≤10 code smells
- **GitHub Actions CI/CD** — automated test + SonarQube analysis on every PR

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Shadcn/UI | Component library |
| Redux Toolkit + RTK Query | State management & data fetching |
| TipTap | Rich text editor |
| Socket.IO Client | Real-time communication |
| React Hook Form + Zod | Form validation |
| React Router v6 | Client-side routing |
| Sonner | Toast notifications |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | Server framework |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Token (JWT) | Authentication |
| Bcrypt | Password hashing |
| Nodemailer | OTP email sending |
| Socket.IO | Real-time events |
| Pino | Structured logging |
| Multer | File upload handling |
| Mocha + Chai + Sinon | Unit testing |
| NYC | Code coverage |
| SonarQube | Code quality analysis |

---

## 📁 Project Structure

```
10-Pearls/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # MongoDB connection
│   │   │   ├── logger.js           # Pino configuration
│   │   │   └── socket.js           # Socket.IO init
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── noteController.js
│   │   │   ├── imageController.js
│   │   │   └── commentController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   ├── errorHandler.js     # Global error handler
│   │   │   ├── asyncHandler.js     # Async wrapper
│   │   │   └── requestLogger.js    # Request/response logging
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Note.js
│   │   │   ├── Image.js
│   │   │   └── Comment.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── noteRoutes.js
│   │   │   ├── imageRoutes.js
│   │   │   └── commentRoutes.js
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   ├── noteService.js
│   │   │   └── exportImportService.js
│   │   ├── socket/
│   │   │   ├── index.js
│   │   │   ├── noteSocket.js
│   │   │   └── authSocket.js
│   │   ├── utils/
│   │   │   ├── customErrors.js
│   │   │   ├── exportFormatters.js
│   │   │   ├── jwtUtils.js
│   │   │   └── otpUtils.js
│   │   └── constants/
│   │       └── errorMessages.js
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── fixtures/
│   │   └── helpers/
│   ├── uploads/images/             # Uploaded images (gitignored)
│   ├── logs/                       # Log files (gitignored)
│   ├── .env.example
│   ├── .mocharc.json
│   ├── sonar-project.properties
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── ImageUploadButton.jsx
│   │   │   │   ├── ResizableImage.js
│   │   │   │   └── ResizableImageComponent.jsx
│   │   │   ├── notes/
│   │   │   │   ├── ExportNoteButton.jsx
│   │   │   │   ├── ExportNotesDialog.jsx
│   │   │   │   └── ImportNotesDialog.jsx
│   │   │   ├── profile/
│   │   │   │   ├── ChangePasswordDialog.jsx
│   │   │   │   ├── ProfileHeader.jsx
│   │   │   │   └── ProfileStats.jsx
│   │   │   ├── common/
│   │   │   │   └── ConnectionStatus.jsx
│   │   │   └── ui/                 # Shadcn components
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── authSlice.js
│   │   │   │   └── authApi.js
│   │   │   ├── notes/
│   │   │   │   ├── notesSlice.js
│   │   │   │   └── notesApi.js
│   │   │   ├── images/
│   │   │   │   └── imagesApi.js
│   │   │   └── comments/
│   │   │       └── commentsApi.js
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   ├── useAuth.js
│   │   │   └── useDebounce.js
│   │   ├── lib/
│   │   │   └── socket.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── VerifyOTPPage.jsx
│   │   │   ├── notes/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── NoteEditorPage.jsx
│   │   │   │   └── NoteDetailPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── store.js
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** v6 or higher — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** — [Download](https://git-scm.com)

Verify installations:
```bash
node --version    # v18.0.0 or higher
npm --version     # v9.0.0 or higher
mongod --version  # v6.0.0 or higher (if local)
git --version     # any recent version
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/abdulwadood/abdulwadood-mern-10pshine.git
cd abdulwadood-mern-10pshine
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Server
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/notes-app
MONGODB_TEST_URI=mongodb://localhost:27017/notes-app-test

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long
JWT_REFRESH_SECRET=your_refresh_secret_key_here_also_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Notes App <your.email@gmail.com>

# Client URL (for CORS and Socket.IO)
CLIENT_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

> **Gmail Setup:** Go to Google Account → Security → 2-Step Verification → App Passwords → Generate a password for "Mail"

Start the backend:
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

---

### 3. Frontend Setup

Open a **new terminal** tab:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Open `.env` and fill in your values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
# Development
npm run dev

# Build for production
npm run build
```

Frontend runs at: `http://localhost:3000`

---

### 4. Run Both Together

From the project root you can run both simultaneously:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open your browser at **http://localhost:3000** 🎉

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/verify-otp        Verify email OTP
POST   /api/auth/resend-otp        Resend OTP
POST   /api/auth/login             Login user
POST   /api/auth/refresh-token     Refresh access token
POST   /api/auth/logout            Logout user
POST   /api/auth/change-password   Change password (auth required)
GET    /api/auth/me                Get current user
PATCH  /api/auth/me                Update profile
```

### Notes
```
GET    /api/notes                  Get all notes (paginated, filterable)
POST   /api/notes                  Create note
GET    /api/notes/:id              Get note by ID
PUT    /api/notes/:id              Update note
DELETE /api/notes/:id              Delete note
PUT    /api/notes/:id/pin          Toggle pin
PUT    /api/notes/:id/archive      Toggle archive
GET    /api/notes/export           Export all notes (JSON/TXT)
POST   /api/notes/import           Import notes from JSON
GET    /api/notes/:id/export       Export single note
GET    /api/notes/stats            Get note statistics
```

### Images
```
POST   /api/images/upload          Upload image
GET    /api/images                 Get user's images
DELETE /api/images/:id             Delete image
```

### Comments
```
GET    /api/notes/:noteId/comments         Get comments
POST   /api/notes/:noteId/comments         Add comment
PATCH  /api/notes/:noteId/comments/:id     Edit comment
DELETE /api/notes/:noteId/comments/:id     Delete comment
```

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

Expected coverage:
- Overall: **70%+**
- Controllers: **80%+**
- Models: **85%+**

---

## 📊 Code Quality (SonarQube)

```bash
# Start SonarQube via Docker
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Run analysis (from backend directory)
npm run sonar:local

# View results
open http://localhost:9000/dashboard?id=notes-app-backend
```

Quality Gate Standards:
- ✅ Reliability: A (0 bugs)
- ✅ Security: A (0 vulnerabilities)
- ✅ Maintainability: A
- ✅ Coverage: ≥ 70%
- ✅ Duplications: ≤ 3%

---

## 🌐 Socket.IO Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Server → Client | `note:created` | `{ note }` |
| Server → Client | `note:updated` | `{ note }` |
| Server → Client | `note:deleted` | `{ noteId }` |
| Server → Client | `note:pinned` | `{ noteId, isPinned }` |
| Server → Client | `note:archived` | `{ noteId, isArchived }` |
| Client → Server | `note:typing` | `{ noteId }` |
| Client → Server | `note:stopTyping` | `{ noteId }` |

---

## 🔧 Environment Variables Reference

### Backend `.env`
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/notes-app` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your_long_secret_here` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `another_long_secret` |
| `EMAIL_USER` | Gmail address | `you@gmail.com` |
| `EMAIL_PASS` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `BASE_URL` | Backend URL for image serving | `http://localhost:5000` |

### Frontend `.env`
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

---

## 👨‍💻 Author

**Abdul Wadood**
- GitHub: [@abdulwadood](https://github.com/abdulwadood)
- University: FAST-NUCES Karachi Campus
- Internship: 10Pearls Shine Internship Program (April 2026 – June 2026)

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgements

- [10Pearls](https://www.10pearls.com) for the Shine Internship Program
- [TipTap](https://tiptap.dev) for the rich text editor
- [Shadcn/UI](https://ui.shadcn.com) for the component library
- [Socket.IO](https://socket.io) for real-time communication

---

<div align="center">
  Made with ❤️ during the 10Pearls Shine Internship 2026
</div>
