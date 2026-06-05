'use strict';

const asyncHandler = require('express-async-handler');
// Import as module reference so sinon can stub in tests
const noteService = require('../services/noteService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  HTTP_STATUS,
  NOTES_SUCCESS_MESSAGES,
  NOTES_ERROR_MESSAGES,
} = require('../config/constants');
const logger = require('../config/logger');
const { getIO } = require('../config/socket');
const { emitNoteEvent } = require('../socket/noteSocket');

// Emit a socket event safely — no-op when Socket.IO isn't initialized (e.g. tests)
function tryEmit(userId, event, data) {
  const io = getIO();
  if (io) emitNoteEvent(io, String(userId), event, data);
}

const createNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.createNote(userId, req.body);
  logger.info({ userId, noteId: note._id }, 'Note created by user');
  tryEmit(userId, 'note:created', { note });
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_CREATED, HTTP_STATUS.CREATED);
});

const createVoiceNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.createVoiceNote(userId, req.body);
  logger.info(
    { userId, noteId: note._id, language: req.body.voiceLanguage },
    'Voice note created by user'
  );
  tryEmit(userId, 'note:created', { note });
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.VOICE_NOTE_CREATED, HTTP_STATUS.CREATED);
});

const getAllNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await noteService.getAllNotes(userId, req.query);
  req.logger?.debug({ userId, total: result.pagination?.totalNotes }, 'Notes list fetched');
  return sendSuccess(res, result, NOTES_SUCCESS_MESSAGES.NOTES_FETCHED);
});

const getNoteById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.getNoteById(req.params.id, userId);
  req.logger?.debug({ userId, noteId: req.params.id }, 'Note fetched');
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_FETCHED);
});

const updateNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.updateNote(req.params.id, userId, req.body);
  req.logger?.info({ userId, noteId: note._id }, 'Note updated');
  tryEmit(userId, 'note:updated', { note });
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_UPDATED);
});

const updateNoteWithVoice = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.updateNoteWithVoice(req.params.id, userId, req.body);
  req.logger?.info(
    { userId, noteId: note._id, language: req.body.voiceLanguage },
    'Note updated with voice'
  );
  tryEmit(userId, 'note:updated', { note });
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.VOICE_NOTE_UPDATED);
});

const patchNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.updateNote(req.params.id, userId, req.body);
  req.logger?.info({ userId, noteId: note._id }, 'Note patched');
  tryEmit(userId, 'note:updated', { note });
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_UPDATED);
});

const deleteNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const noteId = req.params.id;
  await noteService.softDeleteNote(noteId, userId);
  req.logger?.info({ userId, noteId }, 'Note soft-deleted');
  tryEmit(userId, 'note:deleted', { noteId });
  return sendSuccess(res, null, NOTES_SUCCESS_MESSAGES.NOTE_DELETED);
});

const restoreNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.restoreNote(req.params.id, userId);
  req.logger?.info({ userId, noteId: note._id }, 'Note restored from trash');
  tryEmit(userId, 'note:updated', { note });
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_RESTORED);
});

const permanentDeleteNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const noteId = req.params.id;
  await noteService.permanentDeleteNote(noteId, userId);
  req.logger?.info({ userId, noteId }, 'Note permanently deleted');
  tryEmit(userId, 'note:deleted', { noteId });
  return sendSuccess(res, null, NOTES_SUCCESS_MESSAGES.PERMANENT_DELETED);
});

const toggleArchive = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.toggleArchive(req.params.id, userId);
  const msg = note.isArchived
    ? NOTES_SUCCESS_MESSAGES.NOTE_ARCHIVED
    : NOTES_SUCCESS_MESSAGES.NOTE_UNARCHIVED;
  req.logger?.info({ userId, noteId: note._id, isArchived: note.isArchived }, 'Note archive toggled');
  tryEmit(userId, 'note:archived', { noteId: String(note._id), isArchived: note.isArchived });
  return sendSuccess(res, { note, isArchived: note.isArchived }, msg);
});

const togglePin = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.togglePin(req.params.id, userId);
  const msg = note.isPinned
    ? NOTES_SUCCESS_MESSAGES.NOTE_PINNED
    : NOTES_SUCCESS_MESSAGES.NOTE_UNPINNED;
  req.logger?.info({ userId, noteId: note._id, isPinned: note.isPinned }, 'Note pin toggled');
  tryEmit(userId, 'note:pinned', { noteId: String(note._id), isPinned: note.isPinned });
  return sendSuccess(res, { note, isPinned: note.isPinned }, msg);
});

const addTags = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.addTags(req.params.id, userId, req.body.tags);
  req.logger?.info({ userId, noteId: note._id, tagCount: note.tags.length }, 'Tags added to note');
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.TAGS_ADDED);
});

const removeTags = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.removeTags(req.params.id, userId, req.body.tags);
  req.logger?.info({ userId, noteId: note._id, tagCount: note.tags.length }, 'Tags removed from note');
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.TAGS_REMOVED);
});

const getUserTags = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tags = await noteService.getUserTags(userId);
  req.logger?.debug({ userId, count: tags.length }, 'User tags fetched');
  return sendSuccess(res, { tags }, NOTES_SUCCESS_MESSAGES.TAGS_FETCHED);
});

const getNoteStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const stats = await noteService.getNoteStats(userId);
  req.logger?.debug({ userId }, 'Note stats fetched');
  return sendSuccess(res, { stats }, NOTES_SUCCESS_MESSAGES.STATS_FETCHED);
});

const getAllVoiceNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await noteService.getAllVoiceNotes(userId, req.query);
  req.logger?.debug({ userId, total: result.pagination?.totalNotes }, 'Voice notes fetched');
  return sendSuccess(res, result, NOTES_SUCCESS_MESSAGES.VOICE_NOTES_FETCHED);
});

module.exports = {
  createNote,
  createVoiceNote,
  getAllNotes,
  getNoteById,
  updateNote,
  updateNoteWithVoice,
  patchNote,
  deleteNote,
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
