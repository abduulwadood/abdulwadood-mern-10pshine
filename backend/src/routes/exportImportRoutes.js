'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  exportNotesController,
  importNotesController,
  exportSingleNoteController,
} = require('../controllers/exportImportController');

const router = express.Router();

router.use(authenticateToken);

// GET  /api/notes/export?format=json|txt&ids=id1,id2
router.get('/export', exportNotesController);

// POST /api/notes/import  (multipart/form-data, field: file)
router.post('/import', importNotesController);

// GET  /api/notes/:id/export?format=json|txt
router.get('/:id/export', exportSingleNoteController);

module.exports = router;
