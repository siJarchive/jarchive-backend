const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');

router.get('/logs', logController.getLogs);
router.delete('/logs', logController.clearLogs);

module.exports = router;