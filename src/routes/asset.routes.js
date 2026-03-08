// sijarchive/jarchive-backend/.../src/routes/asset.routes.js

const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const upload = require('../middleware/upload');

router.get('/assets', assetController.getAssets);
router.post('/upload', upload.single('file'), assetController.uploadAsset);

// TAMBAHKAN upload.single('file') DI SINI
router.put('/assets/:id', upload.single('file'), assetController.updateAsset);

router.delete('/assets/:id', assetController.deleteAsset);
router.get('/download/:filename', assetController.downloadAsset);
router.delete('/assets/:id/versions/:versionId', assetController.deleteVersion);

module.exports = router;