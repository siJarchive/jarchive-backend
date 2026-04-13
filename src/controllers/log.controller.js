const Log = require('../models/log.model');

exports.getLogs = async (req, res) => {
    try {
        const { action, page = 1, limit = 20 } = req.query;
        
        let query = {};
        if (action && action !== 'all') {
            query.action = action;
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const skip = (pageNum - 1) * limitNum;

        const logs = await Log.find(query)
            .sort({ date: -1, _id: -1 }) 
            .skip(skip)
            .limit(limitNum);
            
        const totalLogs = await Log.countDocuments(query);

        res.json({
            logs,
            currentPage: pageNum,
            totalPages: Math.ceil(totalLogs / limitNum),
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