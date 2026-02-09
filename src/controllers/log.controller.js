const Log = require('../models/log.model');

exports.getLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ date: -1 }).limit(50);
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.clearLogs = async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: 'All logs cleared' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};