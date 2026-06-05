'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const { ValidationError } = require('../utils/customErrors');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only JPEG, PNG, GIF, and WebP images are allowed'));
  }
};

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('image');

const handleImageUpload = (req, res) =>
  new Promise((resolve, reject) => {
    uploadImage(req, res, (err) => (err ? reject(err) : resolve()));
  });

module.exports = { handleImageUpload };
