const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 menit
    max: 10, // Limit per IP 10x
    message: { 
        error: 'Coba lagi setelah 5 menit' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, authController.login);

module.exports = router;