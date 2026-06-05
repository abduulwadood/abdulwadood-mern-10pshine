'use strict';

const multer = require('multer');
const { InvalidRequestError } = require('../utils/customErrors');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (
    file.mimetype === 'application/json' ||
    file.originalname.toLowerCase().endsWith('.json')
  ) {
    cb(null, true);
  } else {
    cb(new InvalidRequestError('Only JSON files are allowed for import'), false);
  }
}

const uploadJSON = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
}).single('file');

function handleFileUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadJSON(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { handleFileUpload };
