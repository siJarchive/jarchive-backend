<div align="center">
  <h1>Jarchive Backend</h1>
  <p>Layanan pemrosesan data, manajemen file, dan streaming untuk platform Jarchive berbasis MVC.</p>
  <p>
    <a href="https://github.com/siJarchive/jarchive-infrastructure">Infrastructure</a> |
    <a href="https://github.com/siJarchive/jarchive-frontend">Frontend</a>
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-%3E%3D6.x-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
</p>

---

Backend Jarchive menyediakan layanan pemrosesan data, manajemen file, dan streaming untuk platform Jarchive. Dibangun dengan Node.js, Express 5, dan MongoDB melalui Mongoose, dengan pemisahan logika mengikuti pola arsitektur Model-View-Controller (MVC).

## Daftar Isi

- [Fitur](#fitur)
- [Konsep dan Arsitektur](#konsep-dan-arsitektur)
- [Struktur Repository](#struktur-repository)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Deployment](#deployment)
- [Referensi API](#referensi-api)
- [Skema Database](#skema-database)
- [Manajemen dan Operasional](#manajemen-dan-operasional)
- [Troubleshooting](#troubleshooting)
- [Keamanan](#keamanan)
- [Lisensi](#lisensi)

---

## Fitur

| Fitur | Deskripsi |
| --- | --- |
| Manajemen File | Mengelola unggahan file lokal dan sistem versioning menggunakan Multer. Batas ukuran upload diset 100 GB per file pada konfigurasi saat ini. |
| Streaming Media | Mendukung streaming video secara langsung menggunakan HTTP Range Requests. |
| Penerbitan Token (JWT) | Menghasilkan JSON Web Token saat login berhasil, berisi klaim peran (`guru` atau `siswa`), berlaku 24 jam. Lihat bagian Keamanan untuk catatan penting terkait validasi token ini. |
| Pencatatan (Logging) | Mencatat aktivitas krusial seperti unggah, perbarui, hapus, hapus versi, dan unduh file ke koleksi `Log`. |
| Approval System | Mengelola status permintaan persetujuan aset (upload/update) dari pengguna peran Siswa. |
| Rate Limiting | Membatasi request pada seluruh endpoint `/api` (100 req/15 menit per IP) dan secara khusus pada `/api/login` (10 req/5 menit per IP). |

---

## Konsep dan Arsitektur

Backend ini mengimplementasikan pola arsitektur Model-View-Controller (MVC).

```text
+----------------+      +-------------------+      +------------------+
|     Client     | <--> |    Routes (API)   | <--> |    Controllers   |
+----------------+      +-------------------+      +------------------+
                                                             |
                                                             v
                                                   +------------------+
                                                   |      Models      |
                                                   |  (Mongoose ORM)  |
                                                   +------------------+
                                                             |
                                                             v
                                                   +------------------+
                                                   |  MongoDB Server  |
                                                   +------------------+
```

`server.js` hanya bertugas melakukan `app.listen`. Inisialisasi Express, koneksi database, serta pemasangan middleware global (CORS, Helmet, rate limiter) dan seluruh route dilakukan terpusat di `src/app.js`.

---

## Struktur Repository

```
jarchive-backend/
├── server.js                  Entry point, app.listen pada 0.0.0.0:PORT.
├── src/
│   ├── app.js                 Inisialisasi Express, CORS, Helmet, rate limiter, mounting route.
│   ├── config/
│   │   └── db.js              Koneksi Mongoose ke MongoDB.
│   ├── controllers/
│   │   ├── asset.controller.js
│   │   ├── auth.controller.js
│   │   ├── log.controller.js
│   │   ├── request.controller.js
│   │   └── stream.controller.js
│   ├── middleware/
│   │   └── upload.js          Konfigurasi disk storage Multer.
│   ├── models/
│   │   ├── asset.model.js
│   │   ├── log.model.js
│   │   └── request.model.js
│   ├── routes/
│   │   ├── asset.routes.js
│   │   ├── auth.routes.js
│   │   ├── log.routes.js
│   │   ├── request.routes.js
│   │   └── stream.routes.js
│   └── utils/
│       └── helper.js          Format ukuran file, inisialisasi folder uploads.
├── Dockerfile                  Image node:20-bookworm.
├── .env.example
├── .gitignore
├── package.json / package-lock.json
└── README.md
```

---

## Prasyarat

| Komponen | Spesifikasi / Versi | Keterangan |
| --- | --- | --- |
| Node.js | >= 18.x | Diperlukan sebagai runtime server. Dockerfile resmi menggunakan image `node:20-bookworm`. |
| npm | >= 9.x | Package manager untuk dependensi. |
| MongoDB | >= 6.x | Diperlukan sebagai instance database. `docker-compose.yml` pada repository infrastruktur menggunakan image `mongo:latest`. |

---

## Instalasi

```bash
git clone https://github.com/siJarchive/jarchive-backend.git
cd jarchive-backend
npm install
```

---

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`. Catatan penting: `.env.example` pada repository ini hanya mendefinisikan `JWT_SECRET`. Variabel lain pada tabel di bawah harus ditambahkan manual apabila backend dijalankan standalone di luar Docker Compose milik `jarchive-infrastructure` (yang menyuntikkan variabel tambahan lewat `env_file`).

```bash
cp .env.example .env
```

| Variabel Lingkungan | Wajib | Default (kode) | Deskripsi |
| --- | --- | --- | --- |
| `PORT` | Tidak | `5000` | Port internal Express. Catatan: variabel `BACKEND_PORT` yang dipakai pada repository infrastruktur hanya memengaruhi pemetaan port host di Docker Compose; kode backend ini hanya membaca `process.env.PORT`, bukan `BACKEND_PORT`. |
| `MONGO_URI` | Tidak | `mongodb://127.0.0.1:27017/jarchive` | String koneksi MongoDB. |
| `JWT_SECRET` | Ya | tidak ada | Kunci kriptografi untuk menandatangani dan memvalidasi JWT. |
| `ADMIN_USER` / `ADMIN_PASS` | Ya | tidak ada | Kredensial login peran Guru, dibandingkan langsung dengan `process.env` saat login. |
| `SISWA_USER` / `SISWA_PASS` | Ya | tidak ada | Kredensial login peran Siswa, dibandingkan langsung dengan `process.env` saat login. |

CORS dikonfigurasi permisif (`origin: '*'`) secara hardcode di `src/app.js` dan tidak dapat diatur lewat environment variable.

---

## Deployment

### Docker (standalone)

```bash
docker build -t jarchive-backend .
docker run -d -p 5000:5000 --env-file .env --name jarchive-backend jarchive-backend
```

### Docker Compose (rekomendasi)

Jalankan melalui repository `jarchive-infrastructure`, yang sudah mengatur network, volume upload, dan koneksi ke MongoDB secara terpusat.

---

## Referensi API

Seluruh endpoint berikut berada di bawah prefix `/api` (rate limit 100 req/15 menit per IP), kecuali `GET /stream/:filename` dan `GET /download/:filename` yang dipasang langsung pada root path. Saat ini tidak ada middleware yang memvalidasi JWT pada endpoint manapun; lihat bagian Keamanan.

### Autentikasi

- `POST /api/login`: memvalidasi `username`/`password` terhadap `ADMIN_USER`/`ADMIN_PASS` atau `SISWA_USER`/`SISWA_PASS`, mengembalikan JWT (berlaku 24 jam). Dibatasi 10 request/5 menit per IP.

### Manajemen Aset

- `GET /api/assets`: daftar aset. Mendukung query `category`, `search` (regex nama, case-insensitive), `sort` (`oldest`, `az`, `size_desc`, `size_asc`; default terbaru), `page`, `limit` (default 8).
- `POST /api/upload`: unggah aset baru (multipart, field `file`).
- `PUT /api/assets/:id`: perbarui metadata aset dan/atau ganti file; file lama otomatis dipindah ke riwayat `versions`.
- `DELETE /api/assets/:id`: hapus aset beserta seluruh riwayat versi dan file fisik terkait.
- `DELETE /api/assets/:id/versions/:versionId`: hapus satu entri riwayat versi tertentu.
- `GET /download/:filename`: unduh file dan mencatat log unduhan. Query opsional `role` (`guru`/`siswa`) memengaruhi detail log yang dicatat.

### Sistem Permintaan (Requests)

- `GET /api/requests`: daftar seluruh permintaan.
- `GET /api/requests/stats`: agregasi jumlah permintaan per status.
- `POST /api/requests`: ajukan permintaan upload/update (multipart, field `file` opsional, status awal `pending`).
- `POST /api/requests/:id/approve`: menyetujui permintaan.
- `POST /api/requests/:id/reject`: menolak permintaan.
- `DELETE /api/requests`: menghapus seluruh data permintaan sekaligus. Tidak tersedia endpoint untuk menghapus satu permintaan berdasarkan ID.

### Layanan File dan Log

- `GET /stream/:filename`: streaming file media secara chunked (HTTP Range Requests).
- `GET /api/logs`: histori aktivitas platform.
- `GET /api/logs/stats`: agregasi jumlah log per jenis aksi.
- `DELETE /api/logs`: menghapus keseluruhan entri log aktivitas.

---

## Skema Database

### `Asset`

| Field | Tipe Data | Deskripsi |
| --- | --- | --- |
| `name` | String | Nama referensi aset. |
| `category` | String | Pengelompokan tipe aset. |
| `description` | String | Deskripsi aset. |
| `filename` | String | Nama file fisik di direktori penyimpanan. |
| `originalName` | String | Nama asli file saat diunggah. |
| `size` | String | Ukuran file dalam format terbaca manusia, contoh `2.5 MB`. |
| `sizeBytes` | Number | Ukuran file dalam byte. |
| `uploadDate` | Date | Default waktu saat dokumen dibuat. |
| `versions` | Array | Riwayat versi terdahulu, masing-masing berisi `filename`, `uploadDate`, `size`, `sizeBytes`, `versionNumber`. |

### `Request`

| Field | Tipe Data | Deskripsi |
| --- | --- | --- |
| `type` | String | Klasifikasi permintaan (`upload` atau `update`). |
| `status` | String | Default `pending`. |
| `studentMessage` | String | Catatan dari pemohon. |
| `tempName`, `tempCategory`, `tempDescription` | String | Metadata sementara sebelum disetujui. |
| `tempFilename`, `tempOriginalName` | String | Referensi file sementara. |
| `tempSize` | String | Ukuran file sementara, format terbaca manusia. |
| `tempSizeBytes` | Number | Ukuran file sementara dalam byte. |
| `targetAssetId` | ObjectId | Referensi ke koleksi `Asset`, khusus operasi `update`. |
| `date` | Date | Default waktu saat dokumen dibuat. |

### `Log`

| Field | Tipe Data | Deskripsi |
| --- | --- | --- |
| `action` | String | Jenis aksi (`upload`, `update`, `delete`, `delete_version`, `download`, dll). |
| `detail` | String | Keterangan detail aksi. |
| `date` | Date | Default waktu saat dokumen dibuat. |

---

## Manajemen dan Operasional

Lingkungan pengembangan (nodemon):

```bash
npm run dev
```

Lingkungan produksi:

```bash
npm start
```

Catatan: `package.json` tidak mendefinisikan script `start` secara eksplisit. `npm start` tetap berfungsi karena npm menjalankan `node server.js` secara default apabila tidak ada script `start` kustom dan `server.js` ada di root proyek.

---

## Troubleshooting

**Mengubah `BACKEND_PORT` tidak berpengaruh saat backend dijalankan standalone**

Variabel ini hanya relevan pada pemetaan port host di `docker-compose.yml` milik repository infrastruktur. Kode backend membaca `process.env.PORT`. Untuk mengubah port standalone, set `PORT` pada `.env`, bukan `BACKEND_PORT`.

**Upload gagal pada file berukuran sangat besar di balik reverse proxy**

Limit Multer pada aplikasi diset 100 GB per file, namun reverse proxy (Nginx, dsb.) di depan backend biasanya memiliki limit body size sendiri yang lebih kecil dan harus disesuaikan terpisah.

---

## Keamanan

- Tidak ada middleware yang memanggil `jwt.verify` pada endpoint manapun di backend ini. Seluruh endpoint `/api/*` (termasuk upload, update, delete aset, approve/reject permintaan) dapat dipanggil tanpa menyertakan token, selama request dapat menjangkau backend secara network. Pembatasan akses berbasis peran (Guru/Siswa) saat ini hanya diterapkan sebagai pembatas tampilan di frontend, bukan kontrol akses di server.
- CORS diatur permisif (`origin: '*'`) secara hardcode, menerima request dari domain mana pun.
- Header keamanan HTTP diterapkan via Helmet (termasuk HSTS dan Content-Security-Policy dasar).
- Rate limiting global pada `/api` dan limiter khusus pada `/api/login` sudah aktif.
- Filter tipe file (`fileFilter`) tersedia pada `src/middleware/upload.js` namun dalam kondisi nonaktif (dikomentari); saat ini tidak ada pembatasan MIME type pada file yang diunggah selain limit ukuran.

---

## Lisensi

`package.json` mencantumkan lisensi ISC, namun repository ini tidak memiliki berkas `LICENSE`. Status lisensi resmi pada level repository belum dapat dipastikan tanpa konfirmasi dari pemilik repositori.

---

<div align="center">
  <sub>Jarchive Backend &nbsp;|&nbsp; <a href="https://github.com/siJarchive/jarchive-infrastructure">Infrastructure</a> &nbsp;|&nbsp; <a href="https://github.com/siJarchive/jarchive-frontend">Frontend</a></sub>
</div>
