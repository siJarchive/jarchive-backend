const express = require('express');
const cors = require('cors');
const path = require('path');
const { uploadDir } = require('./utils/helper');
require('dotenv').config();

// Connect DB
const connectDB = require('./config/db');
connectDB();

const app = express();

// Middleware
app.use(cors());
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