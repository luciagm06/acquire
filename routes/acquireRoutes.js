'use strict';

const express = require('express');
const router = express.Router();
const acquireController = require('../controllers/acquireController');

router.get('/health', acquireController.health);
router.post('/data', acquireController.getData);

module.exports = router;