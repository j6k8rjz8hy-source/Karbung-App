# Memory — Karbung (Pencatat Karangan Bunga)

> Dokumen konteks untuk siapa pun (terutama Claude/AI assistant) yang akan
> memperbaiki atau mengembangkan proyek ini. Baca ini dulu sebelum mengubah kode.

## Latar belakang

Aplikasi ini dibuat Juli 2026 untuk membantu sebuah keluarga mencatat
**karangan bunga** yang diterima di rumah duka. Dipakai banyak anggota keluarga
sekaligus dari HP masing-masing. Data harus live/tersinkron antar semua pengguna.

## Arsitektur (penting — baca dulu)

```
HP pencatat (index.html)  ──┐
HP pencatat lain           ──┼──► Google Apps Script Web App ──► Google Sheets (tab pertama, sumber kebenaran)
HP keluarga (rekap.html)   ──┘                                └─► Google Drive (folder foto)
```

- **Tanpa server & tanpa build.** Semua file statis, JavaScript vanilla,
  di-deploy apa adanya. Jangan menambah framework/bundler.
- **Sumber kebenaran = Google Sheets.** Penyimpanan lokal HP (IndexedDB)
  hanyalah cache/antrean offline.
- **Jembatan ke Google = Apps Script Web App** (kode di `apps-script/Code.gs`).
  Aplikasi memanggilnya via `fetch` (GET untuk baca, POST untuk tulis).

## File di repo

| File | Fungsi |
|---|---|
| `index.html` | Aplikasi pencatat lengkap (satu file: HTML+CSS+JS). Untuk tim pencatat. |
| `rekap.html` | Halaman pantauan keluarga: lihat rekap live + isi tujuan/grouping yang kosong. |
| `apps-script/Code.gs` | Kode Apps Script. **Salinan yang sama juga tertanam di `index.html`** sebagai konstanta `APPS_SCRIPT_CODE` (untuk tombol "Salin kode"). Kalau mengubah satu, ubah dua-duanya. |
| `README.md` | Panduan pemakaian umum. |

## Deployment

- **Branch kerja**: `claude/flower-arrangement-tracker-y4oirp`, lalu di-merge ke `main`.
- **`main` adalah branch produksi.** Dua hosting membaca `main` otomatis:
  - GitHub Pages: `https://j6k8rjz8hy-source.github.io/Karbung-App/`
  - Vercel (proyek milik user, tersambung ke repo ini): `https://<proyek>.vercel.app/`
- Push ke `main` = otomatis live ±1 menit di keduanya. Tidak ada langkah deploy lain.
- **Apps Script TIDAK ikut ter-deploy dari repo.** Perubahan `Code.gs` harus
  ditempel manual oleh user di editor Apps Script, lalu
  **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
  ⚠️ JANGAN "New deployment" — itu mengganti URL, dan URL-nya tertanam di aplikasi.

## ID & konfigurasi penting (per Juli 2026)

- **URL Web App Apps Script** (tertanam sebagai `DEFAULT_SYNC_URL` di `index.html`
  dan `SYNC_URL` di `rekap.html`):
  `https://script.google.com/macros/s/AKfycbx51rgmhqEGPIDECwi92zqzAhkodko0UtZhCMprm44fPYWDMUHlSeAOsca_8VLDenW1/exec`
- **Spreadsheet** (`SHEET_ID`): `1gUnY_favqLa6HibdpvV0S-WTb5EHjMZEK746f7BTadk`
  — data di **tab pertama** ("Sheet 1"); skrip pakai `getSheetByName(SHEET_NAME) || getSheets()[0]`.
- **Folder Drive foto** (`FOTO_FOLDER_ID`): `17ZHPnNNnIV2-MWOOhjwvkGvdyliC5wJu`
  (folder "Karangan Bunga" milik salah satu anggota keluarga; akun yang men-deploy
  Apps Script perlu akses Editor ke folder & spreadsheet ini).
- Kalau URL Apps Script berubah: perbarui `DEFAULT_SYNC_URL` (index.html),
  `SYNC_URL` (rekap.html), dan tambahkan URL lama ke array `OLD_SYNC_URLS`
  (index.html) supaya perangkat lama bermigrasi otomatis.

## Skema data (kolom sheet, tab pertama)

| Kolom | Isi |
|---|---|
| A | Tanggal Penerimaan (teks `10 Jul 2026` dari ketikan manual, atau ISO `2026-07-10` dari app) |
| B | Jenis Karangan (Papan / Standing / Banner / bebas) |
| C | Pengirim (nama di papan) |
| D | Ditujukan Ke |
| E | Grouping (biasanya nama anak almarhum) |
| F | Catatan |
| G | Foto (URL file Drive) |
| H | **CID** — UUID identitas baris. KUNCI anti-duplikat. Jangan dihapus/diedit manual. |

- Baris **ketikan manual** (tanpa CID) otomatis diberi CID oleh Apps Script saat
  `action=list` dipanggil, sehingga ikut tampil di semua app.
- Upsert/delete dari app mencari baris berdasarkan CID.

## Protokol Apps Script (`Code.gs`)

- `GET <url>` → `{ok, app:'karbung', sheetName}` (uji koneksi; `sheetError` bila bermasalah).
- `GET <url>?action=list` → `{ok, items:[{tanggal,jenis,pengirim,tujuan,grouping,catatan,fotoUrl,cid}]}`.
- `POST` body JSON (tanpa header content-type — sengaja, supaya simple request tanpa preflight CORS):
  - `{action:'upsert', cid, tanggal, jenis, pengirim, tujuan, grouping, catatan, fotoBase64?, fotoName?}`
    — update baris ber-CID sama, atau append baru. `fotoBase64` diunggah ke folder
    Drive, URL-nya ke kolom G. Tanpa `fotoBase64`, kolom G lama dipertahankan.
  - `{action:'delete', cid}` — hapus baris.
- Nama file foto: **`PENGIRIM(grouping).jpg`** (dibentuk client di `pushRec`,
  field `fotoName`). Tanpa tanggal — permintaan user.
- `setSharing(ANYONE_WITH_LINK)` dibungkus try/catch **sengaja**: akun user
  dilarang share publik oleh Google; kalau tidak dibungkus, seluruh pencatatan
  gagal (bug yang pernah terjadi).

## Alur sinkron di `index.html`

- **Push**: tiap simpan → `syncAll()` → `pushRec()` per record belum-synced
  (flag `synced`), upsert by CID. Gagal → antre, dicoba lagi saat simpan
  berikut/app dibuka. `fotoUploaded` mencegah upload ulang foto.
- **Pull**: `pullFromSheet()` → `action=list` → merge by CID:
  baru → insert (synced:true); sudah ada & synced → update bila beda (remote menang);
  **lokal belum-synced tidak disentuh** (menang sampai ter-push);
  CID synced yang hilang dari sheet → dihapus lokal (propagasi delete).
- Jadwal pull: saat app dibuka, tiap 60 detik saat tab terlihat, saat
  visibilitychange, dan tombol 🔄 Perbarui di tab Daftar.
- Foto dari HP lain dirender via `https://drive.google.com/thumbnail?id=<ID>&sz=w800`.

## Keputusan teknis yang JANGAN diubah tanpa alasan kuat

1. **Foto disimpan sebagai ArrayBuffer di IndexedDB, bukan Blob.**
   Sebagian browser Android gagal menyimpan Blob
   ("Error preparing Blob/File data to be stored in object store").
   `fotoBlobOf()` mengubah kembali ke Blob saat dipakai.
2. **POST tanpa header Content-Type** → text/plain simple request → tanpa
   preflight CORS (Apps Script tidak melayani OPTIONS).
3. **`.toast { pointer-events:none }`** — tanpa ini toast menghalangi klik tombol.
4. **`navigator.storage.persist()`** dipanggil saat init — kurangi risiko browser
   menghapus data lokal.
5. Error harus **selalu tampil ke user** (toast/baris status dengan pesan asli) —
   kegagalan diam-diam pernah bikin debugging sangat lama.

## Concurrency: input manual + app bersamaan

- Semua tulisan app lewat `LockService` di Apps Script → antar-app tidak pernah tabrakan.
- App append di bawah baris terisi terakhir dan edit/hapus mencari baris via CID
  (bukan nomor baris) → aman terhadap baris manual yang muncul kapan pun.
- Baris manual diberi CID otomatis saat `action=list` → ikut sistem tanpa bentrok.
- Risiko sisa: (1) race sub-detik bila manusia mengetik di baris kosong terbawah
  tepat saat app append — jarang, terlihat jelas, perbaiki manual;
  (2) entri ganda bila dua orang mencatat karangan yang sama lewat jalur berbeda —
  masalah proses, bukan teknis. Hindari sort/hapus/sisip baris massal saat jam ramai.

## Insiden yang pernah terjadi (pelajaran)

- **"Data hilang semua"**: data lokal terikat **per-origin** (alamat situs) dan
  per-browser. User pindah dari link deployment Vercel (yang berganti-ganti) →
  storage kosong. Solusi permanen: pakai domain stabil, dan sheet sebagai sumber
  kebenaran (sudah diterapkan). Jangan sarankan link deployment per-commit.
- **"Akses ditolak: DriveApp"**: (a) user perlu re-otorisasi skrip (Run doGet →
  Review permissions, centang SEMUA izin — layar consent Google punya centang
  granular per izin); (b) `setSharing` dilarang untuk akunnya → sudah dibungkus try/catch.
- **Duplikat**: jangan pernah menyarankan impor CSV/copy-paste dari sheet yang
  sama yang sudah tersinkron — pull otomatis sudah mengambil semuanya, impor
  manual membuat CID baru = baris dobel.

## Cara mengubah/menguji (untuk Claude berikutnya)

- Edit langsung `index.html` / `rekap.html`. Cek sintaks:
  ekstrak `<script>` → `node --check`.
- Ada pola tes end-to-end dengan **playwright-core + Chromium bawaan**
  (`executablePath:'/opt/pw-browsers/chromium'`) + **server mock Apps Script**
  (http.createServer yang melayani GET list / POST upsert-delete dengan header
  `access-control-allow-origin:*`). Tiru pola ini untuk fitur baru — semua fitur
  sinkron diuji begini sebelum rilis.
- Jika mengubah `APPS_SCRIPT_CODE` di index.html, regenerasi `apps-script/Code.gs`
  dari string itu (atau sebaliknya, jaga keduanya identik), lalu **ingatkan user
  untuk tempel ulang di editor Apps Script + Deploy New version**.
- Commit ke branch kerja → merge ke `main` → push keduanya. `main` = produksi.

> Catatan privasi: repo ini publik. Jangan menambahkan nama lengkap, email,
> atau data pribadi keluarga ke dalam repo — cukup ID teknis yang memang sudah
> terpakai di kode.
