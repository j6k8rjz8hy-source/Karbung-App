# 🌸 Karbung — Pencatat Karangan Bunga

Web app sederhana untuk mencatat karangan bunga yang diterima di rumah duka.
Dibuat agar keluarga bisa mencatat langsung dari HP, tanpa server dan tanpa internet.

## Fitur

- **Catat** — foto karangan (kamera/galeri, otomatis dikompres), tanggal penerimaan,
  jenis karangan, pengirim, ditujukan ke, grouping, dan catatan. Kolomnya sama dengan
  Google Sheets yang sudah dipakai keluarga.
- **Daftar** — galeri semua karangan dengan pencarian dan filter grouping / jenis / tanggal.
  Ketuk kartu untuk lihat detail, ubah, unduh foto, atau hapus.
- **Rekap** — total karangan, jumlah per grouping / jenis / tanggal, dan
  **daftar ucapan terima kasih** (pengirim unik, siap disalin).
- **Data** —
  - Ekspor **CSV** dengan kolom yang sama dengan sheet (tinggal paste ke Google Sheets).
  - Impor CSV dari Google Sheets (data lama tidak perlu diketik ulang).
  - **Backup lengkap (JSON, termasuk foto)** dan pulihkan di HP lain — berguna kalau
    pencatatan dibagi ke beberapa orang.

## Cara pakai

Cukup buka `index.html` di browser HP/laptop — satu file, tanpa install apa pun.
Paling praktis: aktifkan **GitHub Pages** untuk repo ini (Settings → Pages → branch),
lalu bagikan link-nya ke anggota keluarga yang bertugas mencatat.

> Data tersimpan di perangkat masing-masing (IndexedDB, offline). Lakukan **backup
> berkala** dari tab Data dan simpan filenya ke Google Drive. Untuk menggabungkan
> catatan beberapa orang, tukar file backup lalu "Pulihkan backup" — data digabung,
> tidak menimpa.

## Teknis

Satu file `index.html` — HTML + CSS + JavaScript vanilla, tanpa dependensi dan tanpa
build step. Penyimpanan IndexedDB (foto sebagai blob JPEG terkompresi ±1400px),
mendukung tema terang/gelap.
