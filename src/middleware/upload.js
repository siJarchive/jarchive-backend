const multer = require('multer');
const { uploadDir } = require('../utils/helper');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

/* // Uncomment bagian ini untuk mengaktifkan filter tipe file yang diizinkan
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        // --- DOKUMEN & TEKS ---
        'application/pdf', // .pdf
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain', // .txt
        'text/csv', // .csv

        // --- GAMBAR ---
        'image/jpeg', // .jpg, .jpeg
        'image/png', // .png
        'image/gif', // .gif
        'image/svg+xml', // .svg
        'image/webp', // .webp

        // --- VIDEO ---
        'video/mp4', // .mp4
        'video/x-matroska', // .mkv
        'video/avi', // .avi
        'video/webm', // .webm

        // --- AUDIO ---
        'audio/mpeg', // .mp3
        'audio/wav', // .wav
        'audio/ogg', // .ogg

        // --- ARSIP COMPRESS ---
        'application/zip', // .zip
        'application/x-rar-compressed', // .rar
        'application/x-7z-compressed' // .7z
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipe file tidak didukung/berbahaya! Format file: ${file.mimetype}`), false);
    }
};
*/

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 * 1024 },
    // fileFilter: fileFilter // Aktifkan filter tipe file dengan menghapus tanda komentar blok di atas
});

module.exports = upload;