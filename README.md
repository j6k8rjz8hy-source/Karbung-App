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
  - **Link otomatis ke Google Sheets** — setiap karangan yang disimpan langsung masuk
    ke sheet, fotonya otomatis diunggah ke folder Drive "Foto Karangan Bunga" dan
    link-nya tercatat di kolom Foto. Kalau sinyal jelek, data mengantre dan terkirim
    otomatis saat online lagi. Beberapa HP bisa menulis ke satu sheet yang sama.
  - Ekspor **CSV** dengan kolom yang sama dengan sheet (tinggal paste ke Google Sheets).
  - Impor CSV dari Google Sheets (data lama tidak perlu diketik ulang).
  - **Backup lengkap (JSON, termasuk foto)** dan pulihkan di HP lain — berguna kalau
    pencatatan dibagi ke beberapa orang.

## Menyambungkan ke Google Sheets (sekali saja, ±3 menit)

1. Buka/buat Google Sheet pencatatan, lalu menu **Extensions → Apps Script**.
2. Hapus isi editor, tempel isi [`apps-script/Code.gs`](apps-script/Code.gs)
   (atau salin dari dalam app: tab Data → "Cara menyambungkan"), lalu simpan.
3. **Deploy → New deployment → Web app**, set *Execute as: Me* dan
   *Who has access: Anyone*, lalu Deploy dan izinkan akses.
4. Salin **Web app URL** dan tempel di app (tab Data), klik **Uji koneksi**,
   lalu **Kirim yang belum tersinkron**.

Satu URL bisa dipakai di banyak HP sekaligus — semua menulis ke sheet yang sama,
tanpa duplikat (tiap karangan punya ID unik).

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
