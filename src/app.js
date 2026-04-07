const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit'); 
const { uploadDir } = require('./utils/helper');
require('dotenv').config();

const connectDB = require('./config/db');
connectDB();

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    hsts: true, 
    xFrameOptions: false, 
    
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-ancestors": ["'self'", "*"], 
            "img-src": ["'self'", "data:", "*"],
            "media-src": ["'self'", "*"],
        },
    },
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Terlalu banyak request dari IP ini, coba lagi nanti.'
});

app.use('/api', limiter);
app.use(express.json());

// Static Folder
app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));

// Route Files
const authRoutes = require('./routes/auth.routes');
const assetRoutes = require('./routes/asset.routes');
const requestRoutes = require('./routes/request.routes');
const logRoutes = require('./routes/log.routes');
const streamRoutes = require('./routes/stream.routes');

// Mount Routes
app.use('/api', authRoutes);     // /api/login
app.use('/api', assetRoutes);    // /api/assets, /api/upload (Note: /download terpisah dibawah)
app.use('/api', requestRoutes);  // /api/requests
app.use('/api', logRoutes);      // /api/logs
app.use('/stream', streamRoutes); // /stream/:filename

const assetController = require('./controllers/asset.controller');
app.get('/download/:filename', assetController.downloadAsset);

module.exports = app;