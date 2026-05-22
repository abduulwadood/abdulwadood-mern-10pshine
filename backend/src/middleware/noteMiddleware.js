'use strict';

const Joi = require('joi');
const mongoose = require('mongoose');
const { HTTP_STATUS, NOTES_CONSTANTS, NOTES_ERROR_MESSAGES } = require('../config/constants');
const { sendError } = require('../utils/responseHandler');

// ── Reusable Joi pieces ───────────────────────────────────────────────────────

const voiceMetadataJoi = Joi.object({
  language: Joi.string().optional(),
  languageName: Joi.string().optional(),
  confidenceScore: Joi.number().min(0).max(1).optional(),
}).optional();

const tagsJoi = Joi.array()
  .items(Joi.string().trim().max(NOTES_CONSTANTS.MAX_TAG_LENGTH))
  .max(NOTES_CONSTANTS.MAX_TAGS)
  .optional();

const colorJoi = Joi.string()
  .pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .optional()
  .messages({ 'string.pattern.base': NOTES_ERROR_MESSAGES.INVALID_COLOR });

const inputMethodJoi = Joi.string().valid('typed', 'voice', 'mixed').optional();

const voiceLanguageJoi = Joi.string().valid('en-US', 'ur-PK', 'auto').optional();

// ── Schemas ───────────────────────────────────────────────────────────────────

const createNoteSchema = Joi.object({
  title: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_TITLE_LENGTH).required(),
  content: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_CONTENT_LENGTH).required(),
  tags: tagsJoi,
  color: colorJoi,
  isPinned: Joi.boolean().optional().default(false),
  inputMethod: inputMethodJoi.default('typed'),
  voiceLanguage: voiceLanguageJoi,
  voiceMetadata: voiceMetadataJoi,
});

const updateNoteSchema = Joi.object({
  title: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  content: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_CONTENT_LENGTH).optional(),
  tags: tagsJoi,
  color: colorJoi,
  isPinned: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional(),
  inputMethod: inputMethodJoi,
  voiceLanguage: voiceLanguageJoi,
  voiceMetadata: voiceMetadataJoi,
});

const voiceNoteSchema = Joi.object({
  title: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_TITLE_LENGTH).required(),
  content: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_CONTENT_LENGTH).required(),
  voiceLanguage: Joi.string().valid('en-US', 'ur-PK', 'auto').required(),
  voiceMetadata: voiceMetadataJoi,
  tags: tagsJoi,
  color: colorJoi,
  isPinned: Joi.boolean().optional().default(false),
});

const voiceUpdateSchema = Joi.object({
  content: Joi.string().trim().min(1).max(NOTES_CONSTANTS.MAX_CONTENT_LENGTH).required(),
  appendToExisting: Joi.boolean().optional().default(false),
  voiceLanguage: Joi.string().valid('en-US', 'ur-PK', 'auto').required(),
  voiceMetadata: voiceMetadataJoi,
});

const addTagsSchema = Joi.object({
  tags: Joi.array()
    .items(Joi.string().trim().max(NOTES_CONSTANTS.MAX_TAG_LENGTH))
    .min(1)
    .max(NOTES_CONSTANTS.MAX_TAGS)
    .required(),
});

const removeTagsSchema = Joi.object({
  tags: Joi.array().items(Joi.string().trim()).min(1).required(),
});

const queryNotesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(NOTES_CONSTANTS.MAX_PAGE_SIZE).default(NOTES_CONSTANTS.DEFAULT_PAGE_SIZE),
  sort: Joi.string().optional(),
  search: Joi.string().min(1).optional(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  color: Joi.string().optional(),
  isPinned: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional(),
  inputMethod: Joi.string().valid('typed', 'voice', 'mixed').optional(),
  voiceLanguage: Joi.string().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
});

// ── Middleware factory ────────────────────────────────────────────────────────

function createBodyValidator(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
    });
    if (error) {
      const details = error.details.map((d) => d.message);
      return sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, details);
    }
    req.body = value;
    return next();
  };
}

function createQueryValidator(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
    });
    if (error) {
      const details = error.details.map((d) => d.message);
      return sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, details);
    }
    req.query = value;
    return next();
  };
}

// ── Exported middleware ───────────────────────────────────────────────────────

const validateCreateNote = createBodyValidator(createNoteSchema);

const validateUpdateNote = (req, res, next) => {
  const { error, value } = updateNoteSchema.validate(req.body, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    return sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, details);
  }
  if (Object.keys(value).length === 0) {
    return sendError(res, NOTES_ERROR_MESSAGES.NO_UPDATE_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }
  req.body = value;
  return next();
};

const validateVoiceNote = createBodyValidator(voiceNoteSchema);

const validateVoiceUpdate = createBodyValidator(voiceUpdateSchema);

const validateQueryNotes = createQueryValidator(queryNotesSchema);

const validateNoteId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendError(res, NOTES_ERROR_MESSAGES.INVALID_NOTE_ID, HTTP_STATUS.BAD_REQUEST);
  }
  return next();
};

const validateAddTags = createBodyValidator(addTagsSchema);

const validateRemoveTags = createBodyValidator(removeTagsSchema);

module.exports = {
  validateCreateNote,
  validateUpdateNote,
  validateVoiceNote,
  validateVoiceUpdate,
  validateQueryNotes,
  validateNoteId,
  validateAddTags,
  validateRemoveTags,
};
