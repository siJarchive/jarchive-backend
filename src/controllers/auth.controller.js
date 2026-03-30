const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
    const { username, password } = req.body;
    let isLogin = false;
    let role = "";

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const siswaUser = process.env.SISWA_USER;
    const siswaPass = process.env.SISWA_PASS;

    if (username === adminUser && password === adminPass) {
        isLogin = true;
        role = 'guru';
    } else if (username === siswaUser && password === siswaPass) {
        isLogin = true;
        role = 'siswa';
    }

    if (isLogin) {
        const token = jwt.sign({ role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    }
    
    res.status(401).json({ error: 'Kredensial tidak valid' });
};