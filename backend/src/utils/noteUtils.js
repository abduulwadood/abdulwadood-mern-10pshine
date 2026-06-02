'use strict';

const mongoose = require('mongoose');
const { NOTES_CONSTANTS, VOICE_CONSTANTS } = require('../config/constants');

function calculateWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function calculateCharacterCount(text) {
  if (!text) return 0;
  return text.length;
}

function calculateReadingTime(wordCount) {
  const WORDS_PER_MINUTE = 200;
  const seconds = Math.ceil((wordCount / WORDS_PER_MINUTE) * 60);
  const minutes = wordCount / WORDS_PER_MINUTE;
  const display = minutes < 1 ? '< 1 min read' : `${Math.round(minutes)} min read`;
  return { seconds, minutes, display };
}

function sanitizeNoteContent(content) {
  if (!content) return '';
  // Remove null characters, trim whitespace
  return content.replace(/\0/g, '').trim();
}

function sanitizeTitle(title) {
  if (!title) return '';
  return title.trim().replace(/  +/g, ' ');
}

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => t.length > 0)
    ),
  ];
}

function validateVoiceLanguage(language) {
  return Object.values(VOICE_CONSTANTS.SUPPORTED_LANGUAGES).includes(language);
}

function getLanguageDisplayName(languageCode) {
  return VOICE_CONSTANTS.SUPPORTED_LANGUAGE_NAMES[languageCode] || languageCode;
}

function buildNoteFilterQuery(userId, filters = {}) {
  const {
    search, tags, color, isPinned, isArchived,
    inputMethod, voiceLanguage, dateFrom, dateTo,
  } = filters;

  const query = {
    userId: new mongoose.Types.ObjectId(String(userId)),
    isDeleted: false,
  };

  if (search) {
    query.$text = { $search: search };
  }
  if (tags) {
    const tagArray = Array.isArray(tags)
      ? tags
      : String(tags).split(',').map((t) => t.trim());
    const filtered = tagArray.filter(Boolean);
    if (filtered.length > 0) query.tags = { $in: filtered };
  }
  if (color) query.color = color;
  if (isPinned !== undefined && isPinned !== null) query.isPinned = isPinned;
  if (isArchived !== undefined && isArchived !== null) query.isArchived = isArchived;
  if (inputMethod) query.inputMethod = inputMethod;
  if (voiceLanguage) query['voiceMetadata.language'] = voiceLanguage;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  return query;
}

function buildNoteSortQuery(sortBy) {
  const sortMap = {
    'createdAt': { createdAt: 1 },
    '-createdAt': { createdAt: -1 },
    'title': { title: 1 },
    '-title': { title: -1 },
    'updatedAt': { updatedAt: 1 },
    '-updatedAt': { updatedAt: -1 },
  };
  return sortMap[sortBy] || { isPinned: -1, createdAt: -1 };
}

function formatNoteResponse(note) {
  const obj = typeof note.toObject === 'function' ? note.toObject() : { ...note };
  // eslint-disable-next-line no-unused-vars
  const { isDeleted, deletedAt, editHistory, __v, ...clean } = obj;
  return clean;
}

function paginateQuery(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(
    NOTES_CONSTANTS.MAX_PAGE_SIZE,
    Math.max(1, parseInt(limit, 10) || NOTES_CONSTANTS.DEFAULT_PAGE_SIZE)
  );
  return { skip: (p - 1) * l, limit: l, page: p };
}

function generateNotePreview(content, maxLength = 150) {
  if (!content) return '';
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) return plainText;
  const trimmed = plainText.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) return `${trimmed.slice(0, lastSpace)}...`;
  return `${trimmed}...`;
}

module.exports = {
  calculateWordCount,
  calculateCharacterCount,
  calculateReadingTime,
  sanitizeNoteContent,
  sanitizeTitle,
  sanitizeTags,
  validateVoiceLanguage,
  getLanguageDisplayName,
  buildNoteFilterQuery,
  buildNoteSortQuery,
  formatNoteResponse,
  paginateQuery,
  generateNotePreview,
};
