const fs = require('fs');
const path = require('path');
const Request = require('../models/request.model');
const Asset = require('../models/asset.model');
const Log = require('../models/log.model');
const { formatBytes, uploadDir } = require('../utils/helper');

exports.createRequest = async (req, res) => {
    try {
        const { type, message, name, category, description, targetAssetId } = req.body;

        const newReq = new Request({
            type,
            studentMessage: message,
            targetAssetId: targetAssetId || null,
            tempName: name || null,
            tempCategory: category || 'Docs',
            tempDescription: description || null,
            tempFilename: req.file ? req.file.filename : null,
            tempOriginalName: req.file ? req.file.originalname : null,
            tempSize: req.file ? formatBytes(req.file.size) : null,
            tempSizeBytes: req.file ? req.file.size : 0
        });
        await newReq.save();
        res.json({ message: 'Request sent' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find().sort({ date: -1 }).populate('targetAssetId');
        res.json(requests);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.clearRequests = async (req, res) => {
    try {
        const pendingRequests = await Request.find({ status: 'pending' });
        pendingRequests.forEach(reqData => {
            if (reqData.tempFilename && fs.existsSync(path.join(uploadDir, reqData.tempFilename))) {
                fs.unlinkSync(path.join(uploadDir, reqData.tempFilename));
            }
        });
        await Request.deleteMany({});
        await Log.create({ action: 'reset', detail: 'Admin cleared all requests' });
        res.json({ message: 'All requests cleared' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.approveRequest = async (req, res) => {
    try {
        const reqData = await Request.findById(req.params.id);
        if (!reqData) return res.status(404).json({ error: 'Not found' });

        if (reqData.type === 'upload') {
            const newAsset = new Asset({
                name: reqData.tempName,
                category: reqData.tempCategory,
                description: reqData.tempDescription,
                filename: reqData.tempFilename,
                originalName: reqData.tempOriginalName,
                size: reqData.tempSize,
                sizeBytes: reqData.tempSizeBytes
            });
            await newAsset.save();
            await Log.create({ action: 'approve', detail: `Approved New Upload: ${newAsset.name}` });

        } else if (reqData.type === 'update') {
            const oldAsset = await Asset.findById(reqData.targetAssetId);
            if (oldAsset) {
                if (reqData.tempFilename) {
                    await Asset.findByIdAndUpdate(reqData.targetAssetId, {
                        $push: {
                            versions: {
                                filename: oldAsset.filename,
                                size: oldAsset.size,
                                sizeBytes: oldAsset.sizeBytes,
                                uploadDate: oldAsset.uploadDate,
                                versionNumber: oldAsset.versions.length + 1
                            }
                        }
                    });
                }

                const updates = {
                    name: reqData.tempName || oldAsset.name,
                    description: reqData.tempDescription || oldAsset.description,
                    category: reqData.tempCategory || oldAsset.category,
                    uploadDate: Date.now()
                };

                if (reqData.tempFilename) {
                    updates.filename = reqData.tempFilename;
                    updates.originalName = reqData.tempOriginalName;
                    updates.size = reqData.tempSize;
                    updates.sizeBytes = reqData.tempSizeBytes;
                }

                await Asset.findByIdAndUpdate(reqData.targetAssetId, updates);
                await Log.create({ action: 'approve', detail: `Approved Update: ${updates.name}` });
            }
        }
        reqData.status = 'approved';
        await reqData.save();
        res.json({ message: 'Approved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.rejectRequest = async (req, res) => {
    try {
        const reqData = await Request.findById(req.params.id);
        if (reqData.tempFilename && fs.existsSync(path.join(uploadDir, reqData.tempFilename))) {
            fs.unlinkSync(path.join(uploadDir, reqData.tempFilename));
        }
        reqData.status = 'rejected';
        await reqData.save();
        res.json({ message: 'Rejected' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};