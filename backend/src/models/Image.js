'use strict';

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename:     { type: String, required: true },
  originalName: { type: String },
  mimeType:     { type: String },
  size:         { type: Number },
  url:          { type: String, required: true },
  width:        { type: Number },
  height:       { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
