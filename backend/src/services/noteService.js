'use strict';

const mongoose = require('mongoose');
const Note = require('../models/Note');
const {
  NOTES_CONSTANTS,
  NOTES_ERROR_MESSAGES,
  VOICE_CONSTANTS,
} = require('../config/constants');
const {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} = require('../utils/customErrors');
const {
  sanitizeTitle,
  sanitizeNoteContent,
  sanitizeTags,
  validateVoiceLanguage,
  getLanguageDisplayName,
  buildNoteFilterQuery,
  buildNoteSortQuery,
  formatNoteResponse,
  paginateQuery,
  generateNotePreview,
} = require('../utils/noteUtils');
const logger = require('../config/logger');

// ── Shared helper ─────────────────────────────────────────────────────────────

async function verifyNoteOwnership(noteId, userId, includeDeleted = false) {
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new ValidationError(NOTES_ERROR_MESSAGES.INVALID_NOTE_ID);
  }

  let query = Note.findOne({ _id: noteId });
  if (includeDeleted) query = query.setOptions({ withDeleted: true });

  const note = await query;
  if (!note) throw new NotFoundError('Note');
  if (String(note.userId) !== String(userId)) {
    throw new ForbiddenError(NOTES_ERROR_MESSAGES.NOTE_ACCESS_DENIED);
  }
  return note;
}

// ── Create operations ─────────────────────────────────────────────────────────

async function createNote(userId, noteData) {
  const {
    title, content, tags, color, isPinned,
    inputMethod, voiceLanguage, voiceMetadata,
  } = noteData;

  const cleanTitle = sanitizeTitle(title);
  const cleanContent = sanitizeNoteContent(content);
  const cleanTags = sanitizeTags(tags || []);

  if (inputMethod === 'voice' && voiceLanguage && !validateVoiceLanguage(voiceLanguage)) {
    throw new ValidationError(NOTES_ERROR_MESSAGES.INVALID_LANGUAGE);
  }

  const notePayload = {
    userId,
    title: cleanTitle,
    content: cleanContent,
    tags: cleanTags,
    isPinned: isPinned || false,
    inputMethod: inputMethod || 'typed',
  };

  if (color) notePayload.color = color;
  if (voiceLanguage) notePayload.voiceLanguage = voiceLanguage;

  if (voiceMetadata) {
    notePayload.voiceMetadata = { ...voiceMetadata };
    if (voiceMetadata.language) {
      notePayload.voiceMetadata.languageName = getLanguageDisplayName(voiceMetadata.language);
    }
  }

  const note = await Note.create(notePayload);
  logger.info({ userId, noteId: note._id, inputMethod: note.inputMethod }, 'Note created');
  return note;
}

async function createVoiceNote(userId, voiceNoteData) {
  const { voiceLanguage, voiceMetadata, ...rest } = voiceNoteData;

  if (!validateVoiceLanguage(voiceLanguage)) {
    throw new ValidationError(NOTES_ERROR_MESSAGES.INVALID_LANGUAGE);
  }

  const languageName = getLanguageDisplayName(voiceLanguage);
  const enrichedMetadata = {
    ...(voiceMetadata || {}),
    language: voiceLanguage,
    languageName,
  };

  const note = await createNote(userId, {
    ...rest,
    inputMethod: 'voice',
    voiceLanguage,
    voiceMetadata: enrichedMetadata,
  });

  logger.info(
    { userId, noteId: note._id, language: voiceLanguage },
    'Voice note created'
  );
  return note;
}

// ── Read operations ───────────────────────────────────────────────────────────

async function getAllNotes(userId, queryParams = {}) {
  const {
    page, limit, sort, search, tags, color,
    isPinned, isArchived, inputMethod, voiceLanguage,
    dateFrom, dateTo,
  } = queryParams;

  const { skip, limit: validLimit, page: currentPage } = paginateQuery(page, limit);
  const filterQuery = buildNoteFilterQuery(userId, {
    search, tags, color, isPinned, isArchived,
    inputMethod, voiceLanguage, dateFrom, dateTo,
  });
  const sortQuery = buildNoteSortQuery(sort);

  const [notes, total] = await Promise.all([
    Note.find(filterQuery).sort(sortQuery).skip(skip).limit(validLimit).lean(),
    Note.countDocuments(filterQuery),
  ]);

  const totalPages = Math.ceil(total / validLimit) || 0;

  logger.debug(
    { userId, total, page: currentPage, inputMethod: inputMethod || 'all' },
    'Notes queried'
  );

  return {
    notes: notes.map((n) => ({ ...formatNoteResponse(n), preview: generateNotePreview(n.content) })),
    pagination: {
      currentPage,
      totalPages,
      totalNotes: total,
      pageSize: validLimit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
    appliedFilters: {
      search: search || null,
      inputMethod: inputMethod || null,
      tags: tags || [],
      isArchived: isArchived !== undefined ? isArchived : null,
      isPinned: isPinned !== undefined ? isPinned : null,
    },
    sort: sortQuery,
  };
}

async function getNoteById(noteId, userId) {
  const note = await verifyNoteOwnership(noteId, userId);
  return note;
}

// ── Update operations ─────────────────────────────────────────────────────────

async function updateNote(noteId, userId, updateData) {
  const note = await verifyNoteOwnership(noteId, userId);

  // Save current state to edit history before applying changes
  const historyEntry = {
    editedAt: new Date(),
    inputMethod: note.inputMethod,
    previousTitle: note.title,
    previousContent: note.content,
  };
  note.editHistory = [...(note.editHistory || []), historyEntry].slice(-5);

  // Sanitize text fields
  if (updateData.title !== undefined) note.title = sanitizeTitle(updateData.title);
  if (updateData.content !== undefined) note.content = sanitizeNoteContent(updateData.content);
  if (updateData.tags !== undefined) note.tags = sanitizeTags(updateData.tags);
  if (updateData.color !== undefined) note.color = updateData.color;
  if (updateData.isPinned !== undefined) note.isPinned = updateData.isPinned;
  if (updateData.isArchived !== undefined) note.isArchived = updateData.isArchived;
  if (updateData.voiceLanguage !== undefined) note.voiceLanguage = updateData.voiceLanguage;

  // Voice metadata update — increment count when voice data is provided
  if (updateData.voiceMetadata) {
    const vm = updateData.voiceMetadata;
    if (vm.language) {
      note.voiceMetadata.language = vm.language;
      note.voiceMetadata.languageName = getLanguageDisplayName(vm.language);
    }
    if (vm.languageName) note.voiceMetadata.languageName = vm.languageName;
    if (vm.confidenceScore !== undefined) note.voiceMetadata.confidenceScore = vm.confidenceScore;
    note.voiceMetadata.voiceEditCount = (note.voiceMetadata.voiceEditCount || 0) + 1;
    note.voiceMetadata.lastVoiceEditAt = new Date();
    note.markModified('voiceMetadata');
  }

  // Input method transition: typed → mixed when voice edits are introduced
  if (updateData.inputMethod) {
    note.inputMethod = updateData.inputMethod;
  } else if (updateData.voiceMetadata && note.inputMethod === 'typed') {
    note.inputMethod = 'mixed';
  }

  note.markModified('editHistory');
  await note.save();
  logger.info({ noteId, userId }, 'Note updated');
  return note;
}

async function updateNoteWithVoice(noteId, userId, voiceUpdateData) {
  const { content, appendToExisting, voiceLanguage, voiceMetadata } = voiceUpdateData;
  const note = await verifyNoteOwnership(noteId, userId);

  // Save edit history
  const historyEntry = {
    editedAt: new Date(),
    inputMethod: note.inputMethod,
    previousTitle: note.title,
    previousContent: note.content,
  };
  note.editHistory = [...(note.editHistory || []), historyEntry].slice(-5);

  // Apply content
  note.content = appendToExisting
    ? `${note.content}\n${sanitizeNoteContent(content)}`
    : sanitizeNoteContent(content);

  // Update voice metadata
  const newCount = (note.voiceMetadata.voiceEditCount || 0) + 1;
  note.voiceMetadata.voiceEditCount = newCount;
  note.voiceMetadata.lastVoiceEditAt = new Date();
  if (voiceLanguage) {
    note.voiceMetadata.language = voiceLanguage;
    note.voiceMetadata.languageName = getLanguageDisplayName(voiceLanguage);
    note.voiceLanguage = voiceLanguage;
  }
  if (voiceMetadata && voiceMetadata.confidenceScore !== undefined) {
    note.voiceMetadata.confidenceScore = voiceMetadata.confidenceScore;
  }
  note.markModified('voiceMetadata');

  // Input method transition
  note.inputMethod = note.inputMethod === 'typed' ? 'mixed' : 'voice';

  note.markModified('editHistory');
  await note.save();
  logger.info({ noteId, userId, voiceLanguage }, 'Note updated with voice');
  return note;
}

// ── Delete operations ─────────────────────────────────────────────────────────

async function softDeleteNote(noteId, userId) {
  const note = await verifyNoteOwnership(noteId, userId);
  if (note.isDeleted) {
    throw new ValidationError(NOTES_ERROR_MESSAGES.NOTE_ALREADY_DELETED);
  }
  await note.softDelete();
  logger.info({ noteId, userId }, 'Note soft-deleted');
  return { success: true };
}

async function restoreNote(noteId, userId) {
  const note = await verifyNoteOwnership(noteId, userId, true);
  if (!note.isDeleted) return note;
  await note.restore();
  logger.info({ noteId, userId }, 'Note restored');
  return note;
}

async function permanentDeleteNote(noteId, userId) {
  const note = await verifyNoteOwnership(noteId, userId, true);
  if (!note.isDeleted) {
    throw new ValidationError(NOTES_ERROR_MESSAGES.MUST_BE_DELETED_FIRST);
  }
  await Note.deleteOne({ _id: noteId }).setOptions({ withDeleted: true });
  logger.info({ noteId, userId }, 'Note permanently deleted');
  return { success: true };
}

// ── Action operations ─────────────────────────────────────────────────────────

async function toggleArchive(noteId, userId) {
  const note = await verifyNoteOwnership(noteId, userId);
  note.isArchived = !note.isArchived;
  await note.save();
  logger.info({ noteId, userId, isArchived: note.isArchived }, 'Note archive toggled');
  return note;
}

async function togglePin(noteId, userId) {
  const note = await verifyNoteOwnership(noteId, userId);
  note.isPinned = !note.isPinned;
  await note.save();
  logger.info({ noteId, userId, isPinned: note.isPinned }, 'Note pin toggled');
  return note;
}

async function addTags(noteId, userId, newTags) {
  const note = await verifyNoteOwnership(noteId, userId);
  const sanitized = sanitizeTags(newTags);
  const merged = [...new Set([...note.tags, ...sanitized])];
  if (merged.length > NOTES_CONSTANTS.MAX_TAGS) {
    throw new ValidationError(
      `Cannot exceed ${NOTES_CONSTANTS.MAX_TAGS} tags. Currently ${note.tags.length}, adding ${sanitized.length}.`
    );
  }
  note.tags = merged;
  await note.save();
  logger.info({ noteId, userId, tagCount: note.tags.length }, 'Tags added');
  return note;
}

async function removeTags(noteId, userId, tagsToRemove) {
  const note = await verifyNoteOwnership(noteId, userId);
  const sanitized = tagsToRemove.map((t) => String(t).trim().toLowerCase());
  note.tags = note.tags.filter((t) => !sanitized.includes(t));
  await note.save();
  logger.info({ noteId, userId }, 'Tags removed');
  return note;
}

async function getUserTags(userId) {
  const result = await Note.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(String(userId)), isDeleted: false } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { tag: '$_id', count: 1, _id: 0 } },
  ]);
  return result;
}

async function getNoteStats(userId) {
  logger.debug({ userId }, 'Fetching note statistics');
  const stats = await Note.getUserNoteStats(userId);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [thisWeek, thisMonth, tagStats, longestNote, mostRecentNote] = await Promise.all([
    Note.countDocuments({
      userId: new mongoose.Types.ObjectId(String(userId)),
      isDeleted: false,
      createdAt: { $gte: weekAgo },
    }),
    Note.countDocuments({
      userId: new mongoose.Types.ObjectId(String(userId)),
      isDeleted: false,
      createdAt: { $gte: monthAgo },
    }),
    getUserTags(userId),
    Note.findOne(
      { userId: new mongoose.Types.ObjectId(String(userId)), isDeleted: false },
      { title: 1, wordCount: 1 }
    ).sort({ wordCount: -1 }).lean(),
    Note.findOne(
      { userId: new mongoose.Types.ObjectId(String(userId)), isDeleted: false },
      { title: 1, createdAt: 1 }
    ).sort({ createdAt: -1 }).lean(),
  ]);

  const result = {
    ...stats,
    mostUsedTags: tagStats.slice(0, 5).map((t) => t.tag),
    notesThisWeek: thisWeek,
    notesThisMonth: thisMonth,
    longestNote: longestNote || null,
    mostRecentNote: mostRecentNote || null,
  };
  logger.debug({ userId, total: result.total }, 'Note statistics calculated');
  return result;
}

async function getAllVoiceNotes(userId, queryParams = {}) {
  const mergedParams = {
    ...queryParams,
    inputMethod: undefined,
  };
  const filterQuery = buildNoteFilterQuery(userId, {
    ...mergedParams,
    inputMethod: undefined,
  });
  filterQuery.inputMethod = { $in: ['voice', 'mixed'] };

  const { skip, limit: validLimit, page: currentPage } = paginateQuery(
    queryParams.page,
    queryParams.limit
  );
  const sortQuery = buildNoteSortQuery(queryParams.sort);

  const [notes, total] = await Promise.all([
    Note.find(filterQuery).sort(sortQuery).skip(skip).limit(validLimit).lean(),
    Note.countDocuments(filterQuery),
  ]);

  const totalPages = Math.ceil(total / validLimit) || 0;

  return {
    notes: notes.map((n) => ({ ...formatNoteResponse(n), preview: generateNotePreview(n.content) })),
    pagination: {
      currentPage,
      totalPages,
      totalNotes: total,
      pageSize: validLimit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
}

module.exports = {
  createNote,
  createVoiceNote,
  getAllNotes,
  getNoteById,
  updateNote,
  updateNoteWithVoice,
  softDeleteNote,
  restoreNote,
  permanentDeleteNote,
  toggleArchive,
  togglePin,
  addTags,
  removeTags,
  getUserTags,
  getNoteStats,
  getAllVoiceNotes,
};
