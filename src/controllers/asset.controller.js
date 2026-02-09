const fs = require('fs');
const path = require('path');
const Asset = require('../models/asset.model');
const Log = require('../models/log.model');
const { formatBytes, uploadDir } = require('../utils/helper');

exports.getAssets = async (req, res) => {
    try {
        const { category, sort, page = 1, limit = 8, search } = req.query;
        let query = {};

        if (category && category !== 'All') query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };

        let sortOption = { uploadDate: -1 };
        if (sort === 'oldest') sortOption = { uploadDate: 1 };
        if (sort === 'az') sortOption = { name: 1 };

        const assets = await Asset.find(query).sort(sortOption).limit(limit * 1).skip((page - 1) * limit);
        const count = await Asset.countDocuments(query);

        res.json({ assets, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadAsset = async (req, res) => {
    try {
        const asset = new Asset({
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: formatBytes(req.file.size),
            sizeBytes: req.file.size,
            versions: []
        });
        await asset.save();
        await Log.create({ action: 'upload', detail: `Admin upload: ${asset.name}` });
        res.json(asset);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (asset) {
            if (fs.existsSync(path.join(uploadDir, asset.filename))) fs.unlinkSync(path.join(uploadDir, asset.filename));
            if (asset.versions) {
                asset.versions.forEach(v => {
                    if (fs.existsSync(path.join(uploadDir, v.filename))) fs.unlinkSync(path.join(uploadDir, v.filename));
                });
            }
            await Log.create({ action: 'delete', detail: `Admin delete: ${asset.name}` });
        }
        await Asset.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateAsset = async (req, res) => {
    try {
        const { name, description, category } = req.body;
        await Asset.findByIdAndUpdate(req.params.id, { name, description, category });
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.downloadAsset = async (req, res) => {
    try {
        const filePath = path.join(uploadDir, req.params.filename);
        const userRole = req.query.role || 'guest';

        if (fs.existsSync(filePath)) {
            const asset = await Asset.findOne({ filename: req.params.filename }) ||
                await Asset.findOne({ "versions.filename": req.params.filename });
            const assetName = asset ? asset.name : req.params.filename;

            let logDetail = userRole === 'guru' ? `Downloaded by Guru: ${assetName}` :
                            userRole === 'siswa' ? `Downloaded by Siswa: ${assetName}` :
                            `Downloaded: ${assetName}`;

            await Log.create({ action: 'download', detail: logDetail });
            res.download(filePath);
        } else {
            res.status(404).send('File not found');
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
};