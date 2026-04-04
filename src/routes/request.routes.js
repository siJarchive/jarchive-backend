const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const upload = require('../middleware/upload');

router.get('/requests/stats', requestController.getRequestStats);
router.get('/requests', requestController.getRequests);
router.post('/requests', upload.single('file'), requestController.createRequest);
router.delete('/requests', requestController.clearRequests);
router.post('/requests/:id/approve', requestController.approveRequest);
router.post('/requests/:id/reject', requestController.rejectRequest);

module.exports = router;