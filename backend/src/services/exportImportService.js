'use strict';

const Note = require('../models/Note');
const logger = require('../config/logger');
const {
  formatAsJSON,
  formatAsTXT,
  validateImportData,
  formatSingleNoteAsJSON,
  formatSingleNoteAsTXT,
} = require('../utils/exportFormatters');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/customErrors');

const VALID_VOICE_LANGUAGES = ['en-US', 'ur-PK'];

async function exportNotes(userId, format = 'json', noteIds = null) {
  const childLogger = logger.child({ action: 'exportNotes', userId: String(userId), format });
  childLogger.info('Starting note export');

  const query = { userId };
  if (noteIds && noteIds.length > 0) {
    query._id = { $in: noteIds };
  }

  const notes = await Note.find(query).sort({ createdAt: -1 });

  if (notes.length === 0) {
    childLogger.warn('No notes found for export');
    return null;
  }

  childLogger.info({ count: notes.length }, 'Notes fetched for export');

  if (format === 'txt') {
    return {
      content: formatAsTXT(notes),
      filename: `notes-export-${Date.now()}.txt`,
      mimeType: 'text/plain',
    };
  }

  return {
    content: JSON.stringify(formatAsJSON(notes, userId), null, 2),
    filename: `notes-export-${Date.now()}.json`,
    mimeType: 'application/json',
  };
}

async function importNotes(userId, fileContent) {
  const childLogger = logger.child({ action: 'importNotes', userId: String(userId) });
  childLogger.info('Starting note import');

  let data;
  try {
    data = JSON.parse(fileContent);
  } catch {
    childLogger.warn('Invalid JSON file uploaded');
    throw new ValidationError('Invalid JSON file. Please upload a valid export file.');
  }

  const { valid, errors } = validateImportData(data);
  if (!valid) {
    childLogger.warn({ errors }, 'Import validation failed');
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }

  const noteDocs = data.notes.map((note) => {
    const inputMethod = ['typed', 'voice', 'mixed'].includes(note.inputMethod)
      ? note.inputMethod
      : 'typed';

    const doc = {
      userId,
      title: String(note.title).substring(0, 200),
      content: String(note.content).substring(0, 50000),
      tags: Array.isArray(note.tags) ? note.tags.slice(0, 10).map((t) => String(t).toLowerCase()) : [],
      color: note.color || '#ffffff',
      isPinned: false,
      isArchived: false,
      inputMethod,
    };

    if (inputMethod !== 'typed' && VALID_VOICE_LANGUAGES.includes(note.voiceLanguage)) {
      doc.voiceLanguage = note.voiceLanguage;
    }

    return doc;
  });

  const inserted = await Note.insertMany(noteDocs, { ordered: false });
  childLogger.info({ count: inserted.length }, 'Notes imported successfully');

  return {
    imported: inserted.length,
    total: data.notes.length,
    skipped: data.notes.length - inserted.length,
  };
}

async function exportSingleNote(userId, noteId, format = 'json') {
  const childLogger = logger.child({
    action: 'exportSingleNote',
    userId: String(userId),
    noteId,
    format,
  });
  childLogger.info('Starting single note export');

  // findById uses the pre-find hook which filters isDeleted — need raw access for own lookup
  const note = await Note.findOne({ _id: noteId });

  if (!note || note.isDeleted) {
    childLogger.warn('Note not found for export');
    throw new NotFoundError('Note');
  }

  if (note.userId.toString() !== String(userId)) {
    childLogger.warn('Unauthorized single-note export attempt');
    throw new ForbiddenError('You do not have access to this note');
  }

  childLogger.info('Note found, formatting for export');

  const safeTitle = note.title
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40) || 'note';

  if (format === 'txt') {
    return {
      content: formatSingleNoteAsTXT(note),
      filename: `note-${safeTitle}-${Date.now()}.txt`,
      mimeType: 'text/plain',
    };
  }

  return {
    content: JSON.stringify(formatSingleNoteAsJSON(note, userId), null, 2),
    filename: `note-${safeTitle}-${Date.now()}.json`,
    mimeType: 'application/json',
  };
}

module.exports = { exportNotes, importNotes, exportSingleNote };
