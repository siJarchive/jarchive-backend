const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const upload = require('../middleware/upload');

router.get('/assets', assetController.getAssets);
router.post('/upload', upload.single('file'), assetController.uploadAsset);
router.put('/assets/:id', assetController.updateAsset);
router.delete('/assets/:id', assetController.deleteAsset);
router.get('/download/:filename', assetController.downloadAsset); // Note: Original was /download/:filename (without /api)

module.exports = router;