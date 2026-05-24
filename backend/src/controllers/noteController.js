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

const createNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.createNote(userId, req.body);
  logger.info({ userId, noteId: note._id }, 'Note created by user');
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_CREATED, HTTP_STATUS.CREATED);
});

const createVoiceNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.createVoiceNote(userId, req.body);
  logger.info(
    { userId, noteId: note._id, language: req.body.voiceLanguage },
    'Voice note created by user'
  );
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.VOICE_NOTE_CREATED, HTTP_STATUS.CREATED);
});

const getAllNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await noteService.getAllNotes(userId, req.query);
  return sendSuccess(res, result, NOTES_SUCCESS_MESSAGES.NOTES_FETCHED);
});

const getNoteById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.getNoteById(req.params.id, userId);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_FETCHED);
});

const updateNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.updateNote(req.params.id, userId, req.body);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_UPDATED);
});

const updateNoteWithVoice = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.updateNoteWithVoice(req.params.id, userId, req.body);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.VOICE_NOTE_UPDATED);
});

const patchNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.updateNote(req.params.id, userId, req.body);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_UPDATED);
});

const deleteNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await noteService.softDeleteNote(req.params.id, userId);
  return sendSuccess(res, null, NOTES_SUCCESS_MESSAGES.NOTE_DELETED);
});

const restoreNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.restoreNote(req.params.id, userId);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.NOTE_RESTORED);
});

const permanentDeleteNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await noteService.permanentDeleteNote(req.params.id, userId);
  return sendSuccess(res, null, NOTES_SUCCESS_MESSAGES.PERMANENT_DELETED);
});

const toggleArchive = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.toggleArchive(req.params.id, userId);
  const msg = note.isArchived
    ? NOTES_SUCCESS_MESSAGES.NOTE_ARCHIVED
    : NOTES_SUCCESS_MESSAGES.NOTE_UNARCHIVED;
  return sendSuccess(res, { note, isArchived: note.isArchived }, msg);
});

const togglePin = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.togglePin(req.params.id, userId);
  const msg = note.isPinned
    ? NOTES_SUCCESS_MESSAGES.NOTE_PINNED
    : NOTES_SUCCESS_MESSAGES.NOTE_UNPINNED;
  return sendSuccess(res, { note, isPinned: note.isPinned }, msg);
});

const addTags = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.addTags(req.params.id, userId, req.body.tags);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.TAGS_ADDED);
});

const removeTags = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const note = await noteService.removeTags(req.params.id, userId, req.body.tags);
  return sendSuccess(res, { note }, NOTES_SUCCESS_MESSAGES.TAGS_REMOVED);
});

const getUserTags = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tags = await noteService.getUserTags(userId);
  return sendSuccess(res, { tags }, NOTES_SUCCESS_MESSAGES.TAGS_FETCHED);
});

const getNoteStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const stats = await noteService.getNoteStats(userId);
  return sendSuccess(res, { stats }, NOTES_SUCCESS_MESSAGES.STATS_FETCHED);
});

const getAllVoiceNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await noteService.getAllVoiceNotes(userId, req.query);
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
