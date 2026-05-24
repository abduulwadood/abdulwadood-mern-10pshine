'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const noteController = require('../controllers/noteController');
const {
  validateCreateNote,
  validateUpdateNote,
  validateVoiceNote,
  validateVoiceUpdate,
  validateQueryNotes,
  validateNoteId,
  validateAddTags,
  validateRemoveTags,
} = require('../middleware/noteMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ── Statistics & Tags (before /:id routes to avoid conflicts) ─────────────────
router.get('/stats', noteController.getNoteStats);
router.get('/tags/all', noteController.getUserTags);

// ── Voice notes ───────────────────────────────────────────────────────────────
router.get('/voice/all', validateQueryNotes, noteController.getAllVoiceNotes);
router.post('/voice', validateVoiceNote, noteController.createVoiceNote);
router.put('/:id/voice', validateNoteId, validateVoiceUpdate, noteController.updateNoteWithVoice);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post('/', validateCreateNote, noteController.createNote);
router.get('/', validateQueryNotes, noteController.getAllNotes);
router.get('/:id', validateNoteId, noteController.getNoteById);
router.put('/:id', validateNoteId, validateUpdateNote, noteController.updateNote);
router.patch('/:id', validateNoteId, validateUpdateNote, noteController.patchNote);
router.delete('/:id', validateNoteId, noteController.deleteNote);

// ── Note actions ──────────────────────────────────────────────────────────────
router.patch('/:id/archive', validateNoteId, noteController.toggleArchive);
router.patch('/:id/pin', validateNoteId, noteController.togglePin);
router.patch('/:id/restore', validateNoteId, noteController.restoreNote);
router.delete('/:id/permanent', validateNoteId, noteController.permanentDeleteNote);

// ── Tags ──────────────────────────────────────────────────────────────────────
router.post('/:id/tags', validateNoteId, validateAddTags, noteController.addTags);
router.delete('/:id/tags', validateNoteId, validateRemoveTags, noteController.removeTags);

module.exports = router;
