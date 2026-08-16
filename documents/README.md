# Folder Dokumen

Taruh file PDF/JPG dokumen asli (Sertifikat Halal, Izin Edar BPOM, NKV, ISO, dll) di folder ini.

Nama file HARUS sama persis dengan field `"file"` yang ada di `data/documents.json`, contoh:

- sertifikat-halal-2025.pdf
- izin-edar-bpom-2025.pdf
- sertifikat-nkv-2024.pdf
- iso-22000-2024.pdf

> Catatan keamanan: jangan pernah meng-commit dokumen asli/rahasia perusahaan ke repository GitHub publik.
> Untuk penggunaan di kantor, simpan file asli di server internal / cloud storage privat, dan ubah
> `server.js` agar mengambil file dari sana (bukan dari folder lokal ini).
