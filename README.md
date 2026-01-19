# Jarchive Backend Server

Pusat kendali API dan penyimpanan file untuk platform Jarchive (SIJA).

##Persiapan Awal
1. Pastikan MongoDB sudah terinstall dan berjalan di port `27017`.
2. Pastikan Node.js sudah terinstall.

## Cara Menjalankan
1. Masuk ke folder: `cd server`
2. Install dependensi: `npm install`
3. Jalankan server: `node server.js`
   - Server akan berjalan di port `5000`.

## Struktur Penting
- `uploads/`: Folder tempat file yang diupload disimpan (diabaikan oleh Git).
- `server.js`: Logika utama backend, sistem approval, dan streaming video.

## Hak Akses Testing
- **Guru**: `guru` / `admin123`
- **Siswa**: `siswa` / `jarchive`
