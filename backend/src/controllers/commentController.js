'use strict';

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Note = require('../models/Note');
const logger = require('../config/logger');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/customErrors');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

// GET /api/notes/:noteId/comments
const getComments = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const userId = String(req.user._id);

  if (!mongoose.Types.ObjectId.isValid(noteId)) throw new NotFoundError('Note');

  const note = await Note.findById(noteId);
  if (!note) throw new NotFoundError('Note');
  if (note.userId.toString() !== userId) throw new ForbiddenError('Access denied');

  const comments = await Comment.find({ noteId })
    .sort({ createdAt: -1 })
    .select('text isEdited editedAt createdAt updatedAt');

  return sendSuccess(res, { comments, total: comments.length }, 'Comments retrieved', HTTP_STATUS.OK);
});

// POST /api/notes/:noteId/comments
const addComment = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { text } = req.body;
  const userId = String(req.user._id);

  if (!mongoose.Types.ObjectId.isValid(noteId)) throw new NotFoundError('Note');
  if (!text?.trim()) throw new ValidationError('Comment text is required');
  if (text.length > 1000) throw new ValidationError('Comment cannot exceed 1000 characters');

  const note = await Note.findById(noteId);
  if (!note) throw new NotFoundError('Note');
  if (note.userId.toString() !== userId) throw new ForbiddenError('Access denied');

  const comment = await Comment.create({ noteId, userId: req.user._id, text: text.trim() });

  logger.info({ userId, noteId, commentId: comment._id }, 'Comment added');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Comment added',
    data: { comment },
  });
});

// PATCH /api/notes/:noteId/comments/:commentId
const editComment = asyncHandler(async (req, res) => {
  const { noteId, commentId } = req.params;
  const { text } = req.body;
  const userId = String(req.user._id);

  if (!text?.trim()) throw new ValidationError('Comment text is required');
  if (text.length > 1000) throw new ValidationError('Comment cannot exceed 1000 characters');

  const comment = await Comment.findById(commentId);
  if (!comment) throw new NotFoundError('Comment');
  if (comment.noteId.toString() !== noteId) throw new NotFoundError('Comment');
  if (comment.userId.toString() !== userId) throw new ForbiddenError('Access denied');

  comment.text = text.trim();
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  logger.info({ userId, commentId }, 'Comment edited');

  return sendSuccess(res, { comment }, 'Comment updated', HTTP_STATUS.OK);
});

// DELETE /api/notes/:noteId/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const { noteId, commentId } = req.params;
  const userId = String(req.user._id);

  const comment = await Comment.findById(commentId);
  if (!comment) throw new NotFoundError('Comment');
  if (comment.noteId.toString() !== noteId) throw new NotFoundError('Comment');
  if (comment.userId.toString() !== userId) throw new ForbiddenError('Access denied');

  await Comment.findByIdAndDelete(commentId);

  logger.info({ userId, commentId }, 'Comment deleted');

  return sendSuccess(res, null, 'Comment deleted', HTTP_STATUS.OK);
});

module.exports = { getComments, addComment, editComment, deleteComment };
