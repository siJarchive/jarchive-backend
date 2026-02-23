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
        await Log.create({ action: 'upload', detail: `Admin mengunggah: ${asset.name}` });
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
            await Log.create({ action: 'delete', detail: `Admin menghapus: ${asset.name}` });
        }
        await Asset.findByIdAndDelete(req.params.id);
        res.json({ message: 'Dihapus' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateAsset = async (req, res) => {
    try {
        const { name, description, category } = req.body;
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        // 1. Update Metadata Dasar
        asset.name = name || asset.name;
        asset.description = description || asset.description;
        asset.category = category || asset.category;

        // 2. Cek apakah ada file baru yang diupload
        if (req.file) {
            // Simpan data file LAMA ke dalam array versions
            const oldVersion = {
                filename: asset.filename, // File lama
                uploadDate: asset.uploadDate, // Tanggal upload lama
                size: asset.size,
                sizeBytes: asset.sizeBytes,
                versionNumber: (asset.versions.length) + 1 // Versi 1, 2, dst
            };

            // Push ke array versions
            asset.versions.push(oldVersion);

            // Update aset utama dengan data file BARU
            asset.filename = req.file.filename;
            asset.originalName = req.file.originalname;
            asset.size = formatBytes(req.file.size);
            asset.sizeBytes = req.file.size;
            asset.uploadDate = Date.now(); // Reset tanggal ke sekarang
        }

        await asset.save();
        await Log.create({ 
            action: 'update', 
            detail: req.file 
                ? `Admin memperbarui file & info: ${asset.name}` 
                : `Admin memperbarui info: ${asset.name}` 
        });

        res.json({ message: 'File berhasil diperbarui', asset });
    } catch (err) {
        // Hapus file yang baru terupload jika database error (cleanup)
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: err.message });
    }
};

exports.downloadAsset = async (req, res) => {
    try {
        const filePath = path.join(uploadDir, req.params.filename);
        const userRole = req.query.role || 'guest';

        if (fs.existsSync(filePath)) {
            // Cek di main asset ATAU di versions
            const asset = await Asset.findOne({ filename: req.params.filename }) ||
                await Asset.findOne({ "versions.filename": req.params.filename });
                
            const assetName = asset ? asset.name : req.params.filename;

            let logDetail = userRole === 'guru' ? `Diunduh oleh Guru: ${assetName}` :
                            userRole === 'siswa' ? `Diunduh oleh Siswa: ${assetName}` :
                            `Diunduh: ${assetName}`;

            await Log.create({ action: 'download', detail: logDetail });
            res.download(filePath);
        } else {
            res.status(404).send('Berkas tidak ditemukan');
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
};