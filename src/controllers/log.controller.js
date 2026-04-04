const Log = require('../models/log.model');

exports.getLogs = async (req, res) => {
    try {
        const { action, page = 1, limit = 20 } = req.query;
        
        let query = {};
        if (action && action !== 'all') {
            query.action = action;
        }

        const skip = (page - 1) * limit;

        const logs = await Log.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const totalLogs = await Log.countDocuments(query);

        res.json({
            logs,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.clearLogs = async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: 'Semua log dibersihkan' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLogStats = async (req, res) => {
    try {
        const stats = await Log.aggregate([
            {
                $group: {
                    _id: "$action",
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