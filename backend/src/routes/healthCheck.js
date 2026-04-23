'use strict';

const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * GET /api/health
 * No authentication required — used by load-balancers and monitoring tools.
 */
router.get('/', getHealth);

module.exports = router;
