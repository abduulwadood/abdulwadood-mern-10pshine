'use strict';

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { exportNotes, importNotes, exportSingleNote } = require('../services/exportImportService');
const { handleFileUpload } = require('../middleware/uploadMiddleware');
const { ValidationError } = require('../utils/customErrors');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../config/logger');

const VALID_FORMATS = ['json', 'txt'];

// GET /api/notes/export?format=json|txt&ids=id1,id2
const exportNotesController = asyncHandler(async (req, res) => {
  const { format = 'json', ids } = req.query;
  const userId = req.user._id;

  if (!VALID_FORMATS.includes(format)) {
    throw new ValidationError('Format must be json or txt');
  }

  const noteIds = ids ? ids.split(',').filter(Boolean) : null;
  const result = await exportNotes(userId, format, noteIds);

  if (!result) {
    return res.status(HTTP_STATUS.OK).json({
      success: false,
      message: 'No notes found to export',
    });
  }

  logger.info({ userId, format, filename: result.filename }, 'Notes exported');

  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Content-Length', Buffer.byteLength(result.content));
  res.send(result.content);
});

// POST /api/notes/import  (multipart/form-data with field "file")
const importNotesController = asyncHandler(async (req, res) => {
  await handleFileUpload(req, res);

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const userId = req.user._id;
  const fileContent = req.file.buffer.toString('utf-8');
  const result = await importNotes(userId, fileContent);

  logger.info({ userId, ...result }, 'Notes imported successfully');

  return sendSuccess(
    res,
    result,
    `Successfully imported ${result.imported} notes`,
    HTTP_STATUS.OK
  );
});

// GET /api/notes/:id/export?format=json|txt
const exportSingleNoteController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'json' } = req.query;
  const userId = req.user._id;

  if (!VALID_FORMATS.includes(format)) {
    throw new ValidationError('Format must be json or txt');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid note ID');
  }

  const result = await exportSingleNote(userId, id, format);

  logger.info({ userId, noteId: id, format, filename: result.filename }, 'Single note exported');

  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Content-Length', Buffer.byteLength(result.content));
  res.send(result.content);
});

module.exports = { exportNotesController, importNotesController, exportSingleNoteController };
