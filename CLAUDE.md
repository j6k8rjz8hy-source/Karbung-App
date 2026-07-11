# Karbung-App

**WAJIB: baca `memory.md` di root repo ini sebelum mengubah apa pun.**
Seluruh konteks proyek ada di sana: arsitektur, ID spreadsheet/folder/URL Apps
Script, skema data & CID, alur sinkron, keputusan teknis yang tidak boleh
diubah, insiden yang pernah terjadi, dan cara menguji.

Ringkas: app statis tanpa build (`index.html` = pencatat, `rekap.html` =
pantauan keluarga) + Google Apps Script sebagai jembatan ke Google Sheets
(sumber kebenaran) dan Drive (foto). Branch `main` = produksi (auto-deploy ke
GitHub Pages & Vercel). Perubahan `apps-script/Code.gs` harus ditempel manual
oleh user di editor Apps Script (Deploy → New version, JANGAN New deployment).
