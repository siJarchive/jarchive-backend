const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
    const { username, password } = req.body;
    let isLogin = false;
    let role = "";

    if (username === 'guru' && password === 'admin123') {
        isLogin = true;
        role = 'guru';
    } else if (username === 'siswa' && password === 'jarchive') {
        isLogin = true;
        role = 'siswa';
    }

    if (isLogin) {
        const token = jwt.sign({ role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Kredensial tidak valid' });
};