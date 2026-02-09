# 📚 Dokumentasi API Backend JArchive

Backend dibangun menggunakan **Node.js** dan **Express**, dengan database **MongoDB**. Sistem ini menangani manajemen aset digital, streaming video, dan sistem permintaan (request) upload dari siswa yang memerlukan persetujuan admin.

## 📂 Struktur Proyek (Refactored)

Backend ini menggunakan arsitektur MVC (Model-View-Controller) untuk skalabilitas.

* **src/config**: Konfigurasi Database & Environment.
* **src/controllers**: Logika bisnis (function) untuk setiap endpoint.
* **src/models**: Skema Database MongoDB (Mongoose).
* **src/routes**: Definisi Endpoint API (GET, POST, dll).
* **src/utils**: Fungsi bantuan (format bytes, path folder).
* **server.js**: Entry point untuk menjalankan server.

## 🛠️ Persiapan & Instalasi

### Prasyarat

1. **Node.js** terinstall di komputer.
2. **MongoDB** berjalan secara lokal di port `27017`.

### Instalasi Dependensi

Pastikan file `package.json` ada, lalu jalankan:

```bash
npm install express mongoose cors multer

```

### Menjalankan Server

```bash
node server.js

```

* **Base URL:** `http://localhost:5000`
* **Database:** `mongodb://127.0.0.1:27017/jarchive`
* **Folder Upload:** `./uploads` (Dibuat otomatis jika belum ada)

---

## 🔐 Autentikasi (Authentication)

Sistem menggunakan *hardcoded credentials* sederhana untuk membedakan role.

### 1. Login

Mengembalikan peran (role) pengguna berdasarkan username dan password.

* **Endpoint:** `POST /api/login`
* **Content-Type:** `application/json`
* **Body:**
```json
{
  "username": "guru",
  "password": "admin123"
}

```


* **Response (Sukses):**
```json
{ "role": "admin" } // atau "student"

```


* **Kredensial Default:**
* **Admin:** `username: guru`, `password: admin123`
* **Siswa:** `username: siswa`, `password: jarchive`



---

## 📂 Manajemen Aset (Assets)

Endpoint ini digunakan oleh Admin untuk mengelola file utama.

### 1. Get All Assets (Filter & Search)

Mengambil daftar aset dengan paginasi, pencarian, dan filter.

* **Endpoint:** `GET /api/assets`
* **Query Parameters (Opsional):**
* `category`: Filter kategori (contoh: `Video`, `Docs`). Gunakan `All` untuk semua.
* `search`: Mencari berdasarkan nama file (case-insensitive).
* `sort`: `oldest` (terlama), `az` (alfabet), default adalah terbaru.
* `page`: Nomor halaman (default: 1).
* `limit`: Item per halaman (default: 8).


* **Response:**
```json
{
  "assets": [ ... ],
  "totalPages": 5,
  "currentPage": 1
}

```



### 2. Upload Asset (Admin)

Mengunggah file baru langsung ke sistem.

* **Endpoint:** `POST /api/upload`
* **Content-Type:** `multipart/form-data`
* **Body (Form-Data):**
* `file`: (File Object)
* `name`: (String) Nama tampilan aset
* `category`: (String) Kategori
* `description`: (String) Deskripsi


* **Response:** Object aset yang baru dibuat.

### 3. Update Asset Info

Mengubah metadata aset (bukan mengganti file).

* **Endpoint:** `PUT /api/assets/:id`
* **Content-Type:** `application/json`
* **Body:**
```json
{
  "name": "Nama Baru",
  "description": "Deskripsi Baru",
  "category": "Docs",
  "file": "File Baru"
}

```



### 4. Delete Asset

Menghapus aset dari database beserta file fisiknya (termasuk versi lama jika ada).

* **Endpoint:** `DELETE /api/assets/:id`

---

## 🙋‍♂️ Sistem Request (Siswa & Approval)

Siswa tidak bisa upload langsung. Mereka mengirim "Request". Admin (Guru) harus menyetujui (Approve) request tersebut agar menjadi Aset.

### 1. Kirim Request (Siswa)

Mengajukan upload baru atau update revisi file.

* **Endpoint:** `POST /api/requests`
* **Content-Type:** `multipart/form-data`
* **Body (Form-Data):**
* `type`: `upload` (untuk file baru) atau `update` (untuk revisi file lama).
* `message`: Pesan dari siswa.
* `file`: (File Object)
* `name`: Nama file (jika type upload).
* `category`: Kategori (jika type upload).
* `targetAssetId`: ID Aset (Wajib jika type `update`).



### 2. Get All Requests (Admin)

Melihat daftar request yang masuk.

* **Endpoint:** `GET /api/requests`

### 3. Approve Request (Admin)

Menyetujui request.

* Jika tipe **upload**: File request dipindahkan menjadi Asset baru.
* Jika tipe **update**: File aset lama disimpan ke *version history*, dan file baru menggantikannya.
* **Endpoint:** `POST /api/requests/:id/approve`

### 4. Reject Request (Admin)

Menolak request dan menghapus file sementara yang diupload siswa.

* **Endpoint:** `POST /api/requests/:id/reject`

### 5. Reset All Requests

Menghapus semua data request dan file sementara yang terkait.

* **Endpoint:** `DELETE /api/requests`

---

## 📺 File Serving & Streaming

### 1. Video Streaming

Digunakan untuk memutar video (mendukung *range requests* agar bisa di-seek/dipercepat).

* **Endpoint:** `GET /stream/:filename`
* **Contoh:** `http://localhost:5000/stream/170589123-video.mp4`

### 2. Download File

Mengunduh file (force download).

* **Endpoint:** `GET /download/:filename`

### 3. Static File Access

Akses langsung ke file. Browser akan otomatis menangani preview berdasarkan tipe file (MIME type).

* **Endpoint:** `http://localhost:5000/uploads/:filename`
* **Support Preview:** * Image (jpg, png, gif)
    * Video (mp4, webm)
    * Document (pdf - akan dirender oleh PDF viewer bawaan browser)

---

## 📜 Logs (Audit Trail)

Mencatat aktivitas sistem (Upload, Delete, Download, Approve, Reset).

### 1. Get Logs

Mengambil 50 log aktivitas terakhir.

* **Endpoint:** `GET /api/logs`

### 2. Clear Logs

Menghapus semua riwayat log.

* **Endpoint:** `DELETE /api/logs`

---

## 🗄️ Skema Database (Mongoose Models)

### 1. `Asset` (Koleksi Aset Utama)

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `name` | String | Nama tampilan file. |
| `category` | String | Kategori (Docs, Video, dll). |
| `filename` | String | Nama file fisik di folder uploads (timestamp-name). |
| `originalName` | String | Nama asli file saat diupload user. |
| `versions` | Array | Array object berisi riwayat versi file lama. |

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