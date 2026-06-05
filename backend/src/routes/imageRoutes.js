'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  uploadImageController,
  getUserImagesController,
  deleteImageController,
} = require('../controllers/imageController');

const router = express.Router();
router.use(authenticateToken);

router.post('/upload', uploadImageController);
router.get('/', getUserImagesController);
router.delete('/:id', deleteImageController);

module.exports = router;
