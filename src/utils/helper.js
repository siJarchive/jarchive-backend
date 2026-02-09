const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

// Pastikan folder uploads ada saat aplikasi mulai
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

function formatBytes(bytes) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
}

module.exports = { formatBytes, uploadDir };