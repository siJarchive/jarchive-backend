<div align="center">
  <h1>Jarchive Backend</h1>
  <p>Layanan pemrosesan data, manajemen file, dan streaming untuk platform Jarchive berbasis MVC.</p>
  <p>
    <a href="https://github.com/siJarchive/jarchive-infrastructure">Infrastructure</a> | 
    <a href="https://github.com/siJarchive/jarchive-frontend">Frontend</a>
  </p>
</div>

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb&logoColor=white)

## Fitur

| Fitur | Deskripsi |
| --- | --- |
| Manajemen File | Mengelola unggahan file lokal dan sistem pembuatan versi (versioning) menggunakan Multer. |
| Streaming Media | Mendukung streaming video secara langsung menggunakan metode HTTP Range Requests. |
| Autentikasi | Menerapkan JSON Web Token (JWT) untuk kontrol akses berbasis peran (Guru dan Siswa). |
| Pencatatan (Logging) | Mencatat setiap aktivitas krusial seperti pengunduhan file dan modifikasi data. |
| Approval System | Mengelola status permintaan persetujuan aset (upload/update) dari pengguna dengan peran Siswa. |

## Konsep dan Arsitektur

Backend ini mengimplementasikan pola arsitektur Model-View-Controller (MVC) murni untuk pemisahan logika aplikasi.

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

## Prasyarat

| Komponen | Spesifikasi / Versi | Keterangan |
| --- | --- | --- |
| Node.js | >= 18.x | Diperlukan sebagai runtime server |
| npm | >= 9.x | Package manager untuk dependensi |
| MongoDB | >= 6.x | Diperlukan sebagai instance database lokal/remote |

## Instalasi

1. Kloning repositori dan masuk ke dalam direktori:

```bash
git clone [https://github.com/siJarchive/jarchive-backend.git](https://github.com/siJarchive/jarchive-backend.git)
cd jarchive-backend

```

2. Instal seluruh dependensi yang dibutuhkan:

```bash
npm install

```

## Konfigurasi

Salin `.env.example` menjadi `.env` dan atur nilai variabel lingkungan berikut. Variabel ini selaras dengan konfigurasi pada repository infrastruktur.

| Variabel Lingkungan | Status | Default | Deskripsi |
| --- | --- | --- | --- |
| `BACKEND_PORT` | Wajib | 5000 | Port host untuk menjalankan server Express. |
| `MONGO_URI` | Wajib | - | String koneksi database MongoDB (contoh: `mongodb://root:password@localhost:27017/jarchive?authSource=admin`). |
| `JWT_SECRET` | Wajib | - | Kunci kriptografi statis untuk menandatangani dan memvalidasi token JWT. |
| `ADMIN_USER` | Wajib | - | Identitas login untuk peran otorisasi Guru. |
| `ADMIN_PASS` | Wajib | - | Kredensial login untuk peran otorisasi Guru. |
| `SISWA_USER` | Wajib | - | Identitas login untuk peran otorisasi Siswa. |
| `SISWA_PASS` | Wajib | - | Kredensial login untuk peran otorisasi Siswa. |

## Struktur Direktori

| Direktori/File | Fungsi |
| --- | --- |
| `src/config/` | Inisialisasi dan konfigurasi koneksi database Mongoose. |
| `src/controllers/` | Logika utama dan pemrosesan dari setiap endpoint API. |
| `src/middleware/` | Interseptor request seperti validasi token dan konfigurasi disk storage Multer. |
| `src/models/` | Definisi skema data dan model untuk eksekusi query MongoDB. |
| `src/routes/` | Pemetaan path URL ke fungsi controller yang relevan. |
| `src/utils/` | Fungsi pembantu (helper) modular seperti format tanggal atau manipulasi direktori. |
| `server.js` | Titik masuk (entry point) utama untuk mengeksekusi aplikasi. |

## Referensi API

### Autentikasi

* `POST /api/auth/login`: Menghasilkan token JWT berdasarkan validasi kredensial.

### Manajemen Aset

* `POST /api/assets`: Mengunggah aset baru atau membuat versi baru dari aset yang ada.
* `GET /api/assets`: Mendapatkan daftar seluruh aset.
* `GET /api/assets/:id`: Mendapatkan detail spesifik sebuah aset.
* `DELETE /api/assets/:id`: Menghapus aset beserta riwayat versinya.

### Sistem Permintaan (Requests)

* `GET /api/requests`: Mendapatkan seluruh daftar permintaan.
* `POST /api/requests`: Membuat entri permintaan unggah atau pembaruan baru (status: *pending*).
* `POST /api/requests/:id/approve`: Menyetujui permintaan (mengubah file *temporary* menjadi aset permanen).
* `POST /api/requests/:id/reject`: Menolak permintaan dan menghapus file *temporary* terkait.
* `DELETE /api/requests/:id`: Menghapus satu data permintaan.
* `DELETE /api/requests`: Menghapus seluruh data permintaan sekaligus.

### Layanan File dan Log

* `GET /stream/:filename`: Melakukan streaming file media secara *chunked*.
* `GET /download/:filename`: Menyediakan header disposisi lampiran untuk unduhan dan mencatat entri log.
* `GET /api/logs`: Menampilkan seluruh histori aktivitas platform.
* `DELETE /api/logs`: Menghapus keseluruhan entri log aktivitas.

## Skema Database

Definisi koleksi MongoDB utama yang digunakan oleh sistem.

### 1. Asset Collection

Mengelola metadata dari file yang telah disetujui.

| Field | Tipe Data | Deskripsi |
| --- | --- | --- |
| `name` | String | Nama referensi aset untuk antarmuka. |
| `category` | String | Pengelompokan tipe aset (contoh: Docs, Video). |
| `filename` | String | Nama referensi sistem internal di dalam direktori penyimpanan. |
| `originalName` | String | Nama asli dari klien saat pertama kali diunggah. |
| `versions` | Array | Riwayat objek versi terdahulu (menyimpan `filename`, `uploadDate`, `size`, `sizeBytes`, `versionNumber`). |

### 2. Request Collection

Mengelola status transaksional sebelum aset dipublikasikan.

| Field | Tipe Data | Deskripsi |
| --- | --- | --- |
| `type` | String | Klasifikasi permintaan (`upload` atau `update`). |
| `status` | String | Posisi siklus hidup saat ini (`pending`, `approved`, `rejected`). |
| `tempFilename` | String | Nama referensi internal selama status masih *pending*. |
| `studentMessage` | String | Catatan teks yang disertakan pemohon. |
| `targetAssetId` | ObjectId | Referensi dinamis ke dokumen koleksi Asset (hanya untuk operasi `update`). |

## Manajemen dan Operasional

Menjalankan backend pada lingkungan pengembangan (*development*):

```bash
npm run dev

```

Menjalankan backend pada lingkungan produksi (*production*):

```bash
npm start

```

*(Catatan: Lingkungan produksi idealnya dijalankan melalui perintah Docker Compose dari repositori infrastruktur).*
