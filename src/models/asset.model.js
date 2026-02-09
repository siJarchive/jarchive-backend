const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
    filename: String,
    uploadDate: { type: Date, default: Date.now },
    size: String,
    sizeBytes: Number,
    versionNumber: Number
});

const AssetSchema = new mongoose.Schema({
    name: String,
    category: String,
    description: String,
    filename: String,
    originalName: String,
    size: String,
    sizeBytes: Number,
    uploadDate: { type: Date, default: Date.now },
    versions: [VersionSchema]
});

module.exports = mongoose.model('Asset', AssetSchema);