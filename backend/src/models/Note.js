'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const logger = require('../config/logger');
const { NOTE_CONSTANTS, PAGINATION_CONSTANTS, VOICE_CONSTANTS } = require('../config/constants');

const { Schema } = mongoose;

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// ── Subdocument schemas ───────────────────────────────────────────────────────

const voiceMetadataSchema = new Schema(
  {
    language: { type: String, default: null },
    languageName: { type: String, default: null },
    voiceEditCount: { type: Number, default: 0 },
    lastVoiceEditAt: { type: Date, default: null },
    confidenceScore: { type: Number, min: 0, max: 1, default: null },
  },
  { _id: false }
);

const editHistoryItemSchema = new Schema(
  {
    editedAt: { type: Date, default: Date.now },
    inputMethod: { type: String, enum: ['typed', 'voice', 'mixed'] },
    previousTitle: { type: String },
    previousContent: { type: String },
  },
  { _id: false }
);

/**
 * Note schema.
 *
 * Soft-delete pattern: notes are never physically removed. `isDeleted` is
 * flipped instead and a `pre(/^find/)` hook transparently excludes deleted
 * documents from every query unless `{ withDeleted: true }` is passed as a
 * query option.
 */
const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      minlength: [
        NOTE_CONSTANTS.TITLE_MIN_LENGTH,
        'Note title is required',
      ],
      maxlength: [
        NOTE_CONSTANTS.TITLE_MAX_LENGTH,
        `Title must not exceed ${NOTE_CONSTANTS.TITLE_MAX_LENGTH} characters`,
      ],
    },

    content: {
      type: String,
      required: [true, 'Note content is required'],
      maxlength: [
        NOTE_CONSTANTS.CONTENT_MAX_LENGTH,
        `Content must not exceed ${NOTE_CONSTANTS.CONTENT_MAX_LENGTH} characters`,
      ],
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
          : tags,
      validate: [
        {
          validator: (tags) => tags.length <= NOTE_CONSTANTS.MAX_TAGS,
          message: `A note may have at most ${NOTE_CONSTANTS.MAX_TAGS} tags`,
        },
        {
          validator: (tags) =>
            tags.every((t) => t.length <= NOTE_CONSTANTS.TAG_MAX_LENGTH),
          message: `Each tag must not exceed ${NOTE_CONSTANTS.TAG_MAX_LENGTH} characters`,
        },
      ],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    color: {
      type: String,
      default: NOTE_CONSTANTS.DEFAULT_COLOR,
      validate: {
        validator: (value) => HEX_COLOR_RE.test(value),
        message: 'Color must be a valid hex code (e.g. #ffffff)',
      },
    },

    lastEditedAt: {
      type: Date,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // ── Module 4: Voice note fields ─────────────────────────────────────────

    inputMethod: {
      type: String,
      enum: ['typed', 'voice', 'mixed'],
      default: 'typed',
      index: true,
    },

    voiceLanguage: {
      type: String,
      enum: ['en-US', 'ur-PK', 'auto', null],
      default: null,
    },

    voiceMetadata: {
      type: voiceMetadataSchema,
      default: () => ({}),
    },

    editHistory: {
      type: [editHistoryItemSchema],
      default: [],
    },

    characterCount: {
      type: Number,
      default: 0,
    },

    wordCount: {
      type: Number,
      default: 0,
    },

    readingTimeSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isDeleted: 1 });
noteSchema.index({ tags: 1 });
// A single compound text index (MongoDB allows only one text index per collection).
noteSchema.index({ title: 'text', content: 'text' });
// Module 4: voice query indexes
noteSchema.index({ userId: 1, inputMethod: 1 });
noteSchema.index({ userId: 1, 'voiceMetadata.language': 1 });

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Refresh `lastEditedAt` whenever the note body changes.
 */
noteSchema.pre('save', function touchLastEdited(next) {
  if (this.isModified('title') || this.isModified('content')) {
    this.lastEditedAt = new Date();
  }
  next();
});

// Auto-calculate word count, character count, reading time on content change.
noteSchema.pre('save', function calculateStats(next) {
  if (this.isModified('content')) {
    if (this.content) {
      const plainText = this.content.replace(/<[^>]*>/g, '').trim();
      const words = plainText.split(/\s+/).filter((w) => w.length > 0);
      this.wordCount = words.length;
    } else {
      this.wordCount = 0;
    }
    this.characterCount = this.content ? this.content.length : 0;
    this.readingTimeSeconds = Math.ceil((this.wordCount / 200) * 60);
  }
  next();
});

noteSchema.post('save', function logSaved(doc) {
  logger.debug({ noteId: doc._id, userId: doc.userId }, 'Note document saved');
});

/**
 * Soft-delete guard: exclude deleted notes from every find-style query
 * unless the caller explicitly opts in with `.setOptions({ withDeleted: true })`.
 */
function excludeDeleted(next) {
  const opts = this.getOptions ? this.getOptions() : {};
  if (opts.withDeleted === true) return next();
  const filter = this.getFilter ? this.getFilter() : this.getQuery();
  if (filter.isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
}

noteSchema.pre(/^find/, excludeDeleted);

// ── Instance methods ─────────────────────────────────────────────────────────

noteSchema.methods.softDelete = function softDelete() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

noteSchema.methods.restore = function restore() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

noteSchema.methods.archive = function archive() {
  this.isArchived = true;
  return this.save();
};

noteSchema.methods.unarchive = function unarchive() {
  this.isArchived = false;
  return this.save();
};

noteSchema.methods.togglePin = function togglePin() {
  this.isPinned = !this.isPinned;
  return this.save();
};

// ── Static methods ───────────────────────────────────────────────────────────

/**
 * Paginated list of a user's notes.
 * @param {string|ObjectId} userId
 * @param {{ page?: number, limit?: number, sort?: object }} [options]
 */
noteSchema.statics.findByUser = function findByUser(userId, options = {}) {
  const page = options.page || PAGINATION_CONSTANTS.DEFAULT_PAGE;
  const limit = Math.min(
    options.limit || PAGINATION_CONSTANTS.DEFAULT_LIMIT,
    PAGINATION_CONSTANTS.MAX_LIMIT
  );
  const sort = options.sort || { createdAt: -1 };
  return this.paginate({ userId, isDeleted: false }, { page, limit, sort, lean: true });
};

noteSchema.statics.findByTag = function findByTag(userId, tag) {
  return this.find({ userId, tags: String(tag).trim().toLowerCase() });
};

noteSchema.statics.searchNotes = function searchNotes(userId, searchTerm) {
  return this.find({ userId, $text: { $search: searchTerm } });
};

noteSchema.statics.getArchivedNotes = function getArchivedNotes(userId) {
  return this.find({ userId, isArchived: true });
};

noteSchema.statics.getPinnedNotes = function getPinnedNotes(userId) {
  return this.find({ userId, isPinned: true });
};

// ── Module 4: Voice static methods ───────────────────────────────────────────

noteSchema.statics.findVoiceNotes = function findVoiceNotes(userId) {
  return this.find({ userId, inputMethod: { $in: ['voice', 'mixed'] } });
};

noteSchema.statics.findByLanguage = function findByLanguage(userId, language) {
  return this.find({ userId, 'voiceMetadata.language': language });
};

noteSchema.statics.getUserNoteStats = async function getUserNoteStats(userId) {
  const userObjId = new mongoose.Types.ObjectId(String(userId));

  const [basicResult] = await this.aggregate([
    { $match: { userId: userObjId, isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pinned: { $sum: { $cond: ['$isPinned', 1, 0] } },
        archived: { $sum: { $cond: ['$isArchived', 1, 0] } },
        typedCount: { $sum: { $cond: [{ $eq: ['$inputMethod', 'typed'] }, 1, 0] } },
        voiceCount: { $sum: { $cond: [{ $eq: ['$inputMethod', 'voice'] }, 1, 0] } },
        mixedCount: { $sum: { $cond: [{ $eq: ['$inputMethod', 'mixed'] }, 1, 0] } },
        totalWords: { $sum: { $ifNull: ['$wordCount', 0] } },
        totalCharacters: { $sum: { $ifNull: ['$characterCount', 0] } },
      },
    },
  ]);

  const [deletedResult] = await this.aggregate([
    { $match: { userId: userObjId, isDeleted: true } },
    { $group: { _id: null, deleted: { $sum: 1 } } },
  ]);

  const langResults = await this.aggregate([
    {
      $match: {
        userId: userObjId,
        isDeleted: false,
        'voiceMetadata.language': { $ne: null },
      },
    },
    { $group: { _id: '$voiceMetadata.language', count: { $sum: 1 } } },
  ]);

  const byLanguage = {};
  langResults.forEach((r) => { if (r._id) byLanguage[r._id] = r.count; });

  const basic = basicResult || {
    total: 0, pinned: 0, archived: 0,
    typedCount: 0, voiceCount: 0, mixedCount: 0,
    totalWords: 0, totalCharacters: 0,
  };

  return {
    total: basic.total,
    active: basic.total,
    deleted: deletedResult ? deletedResult.deleted : 0,
    pinned: basic.pinned,
    archived: basic.archived,
    byInputMethod: {
      typed: basic.typedCount,
      voice: basic.voiceCount,
      mixed: basic.mixedCount,
    },
    byLanguage,
    totalWords: basic.totalWords,
    totalCharacters: basic.totalCharacters,
    averageWordCount: basic.total > 0 ? Math.round(basic.totalWords / basic.total) : 0,
  };
};

// ── Plugins ──────────────────────────────────────────────────────────────────
noteSchema.plugin(mongoosePaginate);

module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema);
