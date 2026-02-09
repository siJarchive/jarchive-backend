const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    type: String,
    status: { type: String, default: 'pending' },
    studentMessage: String,
    tempName: String,
    tempCategory: String,
    tempDescription: String,
    tempFilename: String,
    tempSize: String,
    tempSizeBytes: Number,
    tempOriginalName: String,
    targetAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);