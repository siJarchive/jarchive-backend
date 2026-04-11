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
            tempCategory: category || 'Dokumen',
            tempDescription: description || null,
            tempFilename: req.file ? req.file.filename : null,
            tempOriginalName: req.file ? req.file.originalname : null,
            tempSize: req.file ? formatBytes(req.file.size) : null,
            tempSizeBytes: req.file ? req.file.size : 0
        });
        await newReq.save();
        res.json({ message: 'Permintaan dikirim' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const skip = (pageNum - 1) * limitNum;

        const requests = await Request.find(query)
            .sort({ date: -1, _id: -1 })
            .populate('targetAssetId')
            .skip(skip)
            .limit(limitNum);
            
        const totalRequests = await Request.countDocuments(query);

        res.json({
            requests,
            currentPage: pageNum,
            totalPages: Math.ceil(totalRequests / limitNum),
            totalRequests
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.getRequestStats = async (req, res) => {
    try {
        const stats = await Request.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.json(formattedStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
        await Log.create({ action: 'reset', detail: 'Admin membersihkan semua permintaan' });
        res.json({ message: 'Semua permintaan dibersihkan' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.approveRequest = async (req, res) => {
    try {
        const reqData = await Request.findById(req.params.id);
        if (!reqData) return res.status(404).json({ error: 'Tidak ditemukan' });

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
            await Log.create({ action: 'approve', detail: `Menyetujui Unggahan Baru: ${newAsset.name}` });

        } else if (reqData.type === 'update') {
            const oldAsset = await Asset.findById(reqData.targetAssetId);

            if (!oldAsset) {
                if (reqData.tempFilename && fs.existsSync(path.join(uploadDir, reqData.tempFilename))) {
                    fs.unlinkSync(path.join(uploadDir, reqData.tempFilename));
                }
                return res.status(400).json({ error: 'Gagal disetujui: Asset asli sudah tidak ada/dihapus.' });
            }

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
                await Log.create({ action: 'approve', detail: `Menyetujui Pembaruan: ${updates.name}` });
            }
        }
        reqData.status = 'approved';
        await reqData.save();
        res.json({ message: 'Disetujui' });
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
        res.json({ message: 'Ditolak' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};