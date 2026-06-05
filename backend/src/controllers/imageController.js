'use strict';

const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs').promises;
const Image = require('../models/Image');
const { handleImageUpload } = require('../config/multerImageConfig');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/customErrors');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../config/logger');

let sharp;
try {
  sharp = require('sharp');
} catch {
  // sharp is optional — image dimensions will not be stored without it
}

const getBaseUrl = () =>
  process.env.BASE_URL || process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

// POST /api/images/upload
const uploadImageController = asyncHandler(async (req, res) => {
  await handleImageUpload(req, res);

  if (!req.file) throw new ValidationError('No image file provided');

  const userId = req.user._id;
  const filePath = req.file.path;
  const fileUrl = `${getBaseUrl()}/uploads/images/${req.file.filename}`;

  let width = null;
  let height = null;
  if (sharp) {
    try {
      const meta = await sharp(filePath).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      // non-critical
    }
  }

  const image = await Image.create({
    userId,
    filename:     req.file.filename,
    originalName: req.file.originalname,
    mimeType:     req.file.mimetype,
    size:         req.file.size,
    url:          fileUrl,
    width,
    height,
  });

  logger.info({ userId: String(userId), imageId: image._id, size: req.file.size }, 'Image uploaded');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      imageId: image._id,
      url:     fileUrl,
      width,
      height,
      size:    req.file.size,
    },
  });
});

// GET /api/images
const getUserImagesController = asyncHandler(async (req, res) => {
  const images = await Image.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('url filename originalName size width height createdAt');

  return sendSuccess(res, { images, total: images.length }, 'Images retrieved', HTTP_STATUS.OK);
});

// DELETE /api/images/:id
const deleteImageController = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);

  if (!image) throw new NotFoundError('Image');
  if (image.userId.toString() !== String(req.user._id)) {
    throw new ForbiddenError('You do not own this image');
  }

  try {
    await fs.unlink(path.join(process.cwd(), 'uploads', 'images', image.filename));
  } catch {
    // file may already be gone
  }

  await Image.findByIdAndDelete(req.params.id);

  logger.info({ userId: String(req.user._id), imageId: req.params.id }, 'Image deleted');

  return sendSuccess(res, null, 'Image deleted', HTTP_STATUS.OK);
});

module.exports = { uploadImageController, getUserImagesController, deleteImageController };
