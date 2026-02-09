const express = require('express');
const router = express.Router();
const streamController = require('../controllers/stream.controller');

router.get('/:filename', streamController.streamVideo);

module.exports = router;