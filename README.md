# QA/QC Document Assistant — Final Project (AI Productivity & AI API Integration)

Chatbot berbasis Gemini AI untuk membantu **departemen QA/QC** menjawab pertanyaan dari
**customer atau auditor eksternal** terkait dokumen kualitas produk (Sertifikat Halal, Izin
Edar BPOM, NKV, ISO, dll) — sekaligus membagikan file dokumennya secara otomatis.

---

## 1. Konsep

| Aspek | Detail |
|---|---|
| **Use case** | Customer service bot (khusus dokumen legalitas/kualitas produk) |
| **Target user** | Customer & auditor eksternal yang butuh bukti sertifikasi produk |
| **Gaya bahasa** | Formal, profesional, Bahasa Indonesia |
| **Domain pengetahuan** | Katalog dokumen QA/QC perusahaan (Halal, BPOM, NKV, ISO) |
| **Fitur tambahan** | Membagikan file dokumen (download link), riwayat percakapan per sesi |

**Kenapa parameternya seperti ini?**
Auditor/customer butuh jawaban yang *akurat dan tidak mengarang* (tidak boleh halusinasi nomor
sertifikat), jadi chatbot **dibatasi hanya menjawab dari katalog dokumen resmi** yang didefinisikan
perusahaan (`data/documents.json`), bukan dari pengetahuan umum model.

---

## 2. Alur (Flow)

```
Customer/Auditor              Frontend (public/)          Backend (server.js)              Gemini API
      |                              |                              |                             |
      |  ketik pertanyaan            |                              |                             |
      |----------------------------->|                              |                             |
      |                              |  POST /api/chat              |                             |
      |                              |----------------------------->|                              |
      |                              |                              |  system prompt + katalog     |
      |                              |                              |  dokumen + pertanyaan user   |
      |                              |                              |---------------------------->|
      |                              |                              |                              |
      |                              |                              |  JSON: {answer, documentIds} |
      |                              |                              |<----------------------------|
      |                              |  {answer, documents[]}       |                              |
      |                              |<-----------------------------|                              |
      |  jawaban + tombol "Unduh"    |                              |                              |
      |<-----------------------------|                              |                              |
      |  klik "Unduh"                |                              |                              |
      |----------------------------->|  GET /api/documents/:id      |                              |
      |                              |----------------------------->|                              |
      |                              |          file (PDF)          |                              |
      |<----------------------------------------------------------- |                              |
```

Inti dari alurnya: Gemini **tidak menyimpan file**, ia hanya menentukan dokumen mana yang relevan
(`documentIds`) berdasarkan katalog yang dikirim di system prompt. Backend lah yang benar-benar
menyimpan/menyajikan file lewat endpoint `/api/documents/:id`.

---

## 3. Struktur Project

```
qa-qc-chatbot/
├── server.js              # Backend Express + integrasi Gemini API
├── package.json
├── .env.example            # Contoh konfigurasi API key
├── .gitignore
├── data/
│   └── documents.json      # Katalog metadata dokumen (edit sesuai dokumen asli perusahaan)
├── documents/
│   └── README.md           # Taruh file PDF asli di sini
└── public/                 # Frontend chat sederhana
    ├── index.html
    ├── style.css
    └── script.js
```

---

## 4. Cara Pembuatan — Step by Step (sesuai alur training)

### Sesi 1 — Setup dasar (mengikuti "Pengenalan AI & Membuat Website")
1. Install **Node.js v18+** → cek dengan `node -v`.
2. Install **VS Code** (rekomendasi extension: REST Client, Prettier, .env support).
3. Install **Git** → jalankan `git config --global user.name "Nama"` dan `git config --global user.email "email@kamu.com"`.
4. Buat akun **GitHub** untuk repository deliverable.

### Sesi 2 — Ambil API Key & pahami Gemini API ("Eksplorasi Gemini AI API")
5. Buka **Google AI Studio** → https://aistudio.google.com/
6. Klik **"Get API Key"** → generate API key baru.
7. Copy API key tersebut, nanti dipakai di file `.env`.
8. (Opsional) Coba dulu API-nya di **Postman** dengan request POST ke:
   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=API_KEY`

### Sesi 3 — Bangun chatbot ("Pembuatan Chatbot berbasis Gemini AI Model")
9. Download/extract project ini, lalu buka foldernya di VS Code.
10. Jalankan di terminal:
    ```bash
    npm install
    ```
11. Salin `.env.example` menjadi `.env`, lalu isi `GEMINI_API_KEY` dengan API key dari langkah 6.
12. **Ganti isi `data/documents.json`** dengan daftar dokumen QA/QC yang sebenarnya di tempat
    kerjamu (nama, kategori, penerbit, masa berlaku, nama file).
13. Taruh file PDF dokumen asli di folder `documents/` (nama file harus sama persis dengan
    field `"file"` di `documents.json`) — baca `documents/README.md`.
14. Jalankan server:
    ```bash
    npm start
    ```
15. Buka browser ke `http://localhost:3000` → coba chat, misalnya:
    *"Apakah produk lini A sudah punya sertifikat halal?"*
16. Uji juga endpoint API langsung lewat Postman (`POST /api/chat`) untuk memastikan
    response JSON-nya sesuai.

### Deliverables (sesuai instruksi Final Project)
17. Buat repository baru di **GitHub**, push project ini (pastikan `.env` **tidak ikut ter-push**
    karena sudah ada di `.gitignore`).
    ```bash
    git init
    git add .
    git commit -m "Initial commit: QA/QC Document Assistant chatbot"
    git branch -M main
    git remote add origin <URL_REPO_KAMU>
    git push -u origin main
    ```
18. Ambil screenshot tampilan chatbot (UI) untuk dilampirkan sebagai deliverable.
19. Kumpulkan **URL repository GitHub** + **screenshot UI**.

---

## 5. Catatan Sebelum Dipakai untuk Pekerjaan Sungguhan

Karena kamu berencana menerapkan ini di kantor untuk QA/QC, beberapa hal yang perlu ditambahkan
sebelum benar-benar go-live (di luar cakupan tugas training, tapi penting):

- **Verifikasi & approval konten**: pastikan setiap dokumen di `documents.json` sudah melalui
  approval tim QA/QC/legal sebelum bisa dibagikan otomatis ke pihak eksternal.
- **Keamanan file**: jangan simpan dokumen asli di repo publik GitHub. Gunakan storage privat
  (Google Drive/S3 internal) dan ubah endpoint `/api/documents/:id` agar mengambil dari sana,
  bukan folder lokal.
- **Autentikasi/akses terbatas**: pertimbangkan menambahkan login sederhana atau kode akses
  khusus untuk auditor, supaya tidak sembarang orang bisa menarik semua dokumen.
- **Audit log**: catat siapa/kapan meminta dokumen apa (berguna untuk keperluan audit ISO/BPOM).
- **Rate limiting**: batasi jumlah request per user/IP agar tidak disalahgunakan/membengkakkan
  biaya API.
- **Hosting**: untuk penggunaan nyata, deploy backend ke layanan seperti Render/Railway/VPS
  internal perusahaan (bukan hanya `localhost`).

---

## 6. Referensi Belajar Tambahan (dari materi self-learning training)
- Gemini API — Generate Content: https://ai.google.dev/api/generate-content?hl=id
- Gemini AI API Quickstart: https://ai.google.dev/gemini-api/docs/quickstart?hl=id
- Google Gen AI SDK (Node.js): https://googleapis.github.io/js-genai/release_docs/index.html
- Using Gemini With Node.js: https://medium.com/@price_kj/using-gemini-with-nodejs-cabee90dc598
