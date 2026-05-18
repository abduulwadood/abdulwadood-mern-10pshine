'use strict';

/**
 * Barrel export for all Mongoose models.
 * Importing this module guarantees every schema is registered exactly once.
 */
const User = require('./User');
const Note = require('./Note');

module.exports = { User, Note };
