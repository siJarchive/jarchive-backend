# Dokumentasi API Backend JArchive

Backend ini berfungsi sebagai layanan pemrosesan data, manajemen file, dan streaming untuk platform JArchive. Dibangun menggunakan Node.js, Express, dan MongoDB dengan arsitektur MVC (Model-View-Controller).

## Struktur Direktori

* **src/config**: Konfigurasi koneksi database Mongoose.
* **src/controllers**: Logika utama penanganan request API.
* **src/models**: Definisi skema data untuk MongoDB.
* **src/routes**: Definisi jalur endpoint API.
* **src/middleware**: Penanganan upload file menggunakan Multer.
* **src/utils**: Fungsi pembantu seperti manajemen folder dan format data.
* **server.js**: File utama untuk menjalankan aplikasi.

## Variabel Lingkungan (.env)

Konfigurasi backend bergantung pada variabel berikut yang didefinisikan dalam file `.env` di folder infrastruktur:

* **BACKEND_PORT**: Port internal (default: 5000).
* **MONGO_URI**: String koneksi database (contoh: `mongodb://root:password@mongo:27017/jarchive?authSource=admin`).
* **JWT_SECRET**: Kunci rahasia untuk tanda tangan token keamanan.
* **ADMIN_USER / ADMIN_PASS**: Kredensial untuk akses akun Guru.
* **SISWA_USER / SISWA_PASS**: Kredensial untuk akses akun Siswa.

## Instalasi dan Menjalankan Aplikasi

### Melalui Docker (Rekomendasi)
Backend ini dikonfigurasi untuk berjalan di dalam container melalui `docker-compose.yml` pada folder infrastruktur.
1. Pindah ke folder infrastruktur.
2. Jalankan perintah:
```bash
docker compose up -d --build
```

### Melalui Node.js Lokal
1. Instal dependensi:
```bash
npm install
```
2. Jalankan server:
```bash
npm start
```

## Daftar Endpoint API

### Autentikasi
* **POST /api/login**: Melakukan verifikasi kredensial dan mengembalikan JWT.

### Manajemen Aset
* **GET /api/assets**: Mengambil daftar aset dengan dukungan filter kategori, pencarian, dan paginasi.
* **POST /api/upload**: Mengunggah aset baru (Khusus Admin/Guru).
* **PUT /api/assets/:id**: Memperbarui metadata atau mengganti file aset. File lama akan dipindahkan ke riwayat versi.
* **DELETE /api/assets/:id**: Menghapus aset secara permanen dari database dan penyimpanan fisik.
* **DELETE /api/assets/:id/versions/:versionId**: Menghapus versi lama tertentu dari riwayat aset.

### Sistem Permintaan (Request)
* **POST /api/requests**: Siswa mengirim permintaan upload atau update file.
* **GET /api/requests**: Admin melihat daftar permintaan yang masuk.
* **POST /api/requests/:id/approve**: Admin menyetujui permintaan. File dipindahkan dari folder sementara ke folder aset utama.
* **POST /api/requests/:id/reject**: Admin menolak permintaan dan menghapus file terkait.
* **DELETE /api/requests**: Menghapus seluruh data permintaan.

### Layanan File dan Log
* **GET /stream/:filename**: Melakukan streaming file video dengan dukungan range request.
* **GET /download/:filename**: Mengunduh file dan mencatat aktivitas pengunduhan ke dalam log.
* **GET /api/logs**: Mengambil riwayat aktivitas sistem.
* **DELETE /api/logs**: Membersihkan seluruh data log aktivitas.

## Skema Database

### 1. `Asset` (Koleksi Aset Utama)

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `name` | String | Nama tampilan file. |
| `category` | String | Kategori (Docs, Video, dll). |
| `filename` | String | Nama file fisik di folder uploads (timestamp-name). |
| `originalName` | String | Nama asli file saat diupload user. |
| `versions` | Array | Riwayat file lama. Berisi: `filename`, `uploadDate`, `size`, `sizeBytes`, dan `versionNumber`. |

### 2. `Request` (Koleksi Permintaan)

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `type` | String | `upload` atau `update`. |
| `status` | String | `pending`, `approved`, `rejected`. |
| `tempFilename` | String | Nama file sementara sebelum di-approve. |
| `studentMessage` | String | Pesan dari siswa. |
| `targetAssetId` | ObjectId | Referensi ke aset jika tipe adalah update. |

### 3. `Log` (Koleksi Riwayat)

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `action` | String | Jenis aksi (upload, delete, dll). |
| `detail` | String | Keterangan detail aksi. |
| `date` | Date | Waktu kejadian. |