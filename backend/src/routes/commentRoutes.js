'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getComments, addComment, editComment, deleteComment } = require('../controllers/commentController');

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

router.get('/', getComments);
router.post('/', addComment);
router.patch('/:commentId', editComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
