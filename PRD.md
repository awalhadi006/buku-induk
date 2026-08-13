# PRD — Buku Induk Santri

**Versi**: 1.0 (draft) · **Status**: disetujui untuk dikembangkan

## Ringkasan

Website data induk santri — arsip master data santri pesantren versi digital. Menggantikan buku induk fisik dan file Excel: seluruh data santri tersimpan rapi, mudah dicari/difilter, memiliki histori perubahan lengkap, bisa diimpor dari Excel, serta menghasilkan dokumen cetak (kartu santri, kutipan buku induk) dan rekap. Data bisa dicek kapan saja, dari mana saja, di perangkat apa saja.

## Non-Goals (di luar lingkup v1)

- Pembayaran SPP, absensi, nilai/rapor, multimedia — **website terpisah** di masa depan.
- Sinkron otomatis ke Dapodik (API) — fase 2, menunggu ada yang mampu buat appKey.
- Single Sign-On lintas aplikasi guru — fase 2; v1 memakai username + password.
- Import akun massal via Excel — fase 2; v1 membuat akun manual satu-satu.

## Aktor & matriks izin (default)

| Kemampuan | Superadmin | Admin TU | Wali Kamar | Wali Kelas | Asatidz |
|---|---|---|---|---|---|
| Kelola data santri & wali (CRUD) | ✓ | ✓ | ✓ (kamar) | ✓ (kelas) | — |
| Lihat detail data santri (penuh) | ✓ | ✓ | ✓ (kamar) | ✓ (kelas) | — |
| Hapus data | ✓ | ✓ | — | — | — |
| Cetak & ekspor | ✓ | ✓ | ✓ (kartu kamar) | ✓ (kartu kelas) | — |
| Import Excel | ✓ | ✓ | — | — | — |
| Dashboard angka rekap | ✓ | ✓ | — | — | ✓ |
| Kelola pengguna & peran & izin | ✓ | — | — | — | — |
| Konfigurasi field | ✓ | — | — | — | — |
| Setting tahun ajaran aktif | ✓ | — | — | — | — |
| Lihat audit log | ✓ | — | — | — | — |

Catatan: seluruh izin di atas **dapat diubah** Superadmin di menu **Peran & Izin** saat runtime. Default: hak edit Wali Kamar/Kelas **ON** (untuk perbaiki salah input atas konfirmasi TU), kecuali edit **NIK/NISN** default admin (dapat dinyalakan). Delete hanya Superadmin/Admin TU.

## Fitur v1

### 1. Autentikasi & akun
- Login username + password (Supabase Auth). User ganti password sendiri; Superadmin reset.
- Akun dibuat manual oleh Superadmin (tipe peran: superadmin, admin-tu, wali-kamar, wali-kelas, asatidz).
- Penetapan "wali kamar X" / "wali kelas Y" oleh Superadmin.

### 2. Dashboard rekapitulasi
- Kartu angka + chart sederhana.
- Metrik (default): total santri, per status santri, per jenis kelamin, per kamar, per kelas, per asal daerah.
- Metrik dikonfigurasi via form (list angka apa saja yang ditampilkan).
- Asatidz hanya melihat halaman ini; Superadmin/Admin TU melihatnya juga.

### 3. Kelola data santri
- CRUD lengkap dengan field identitas standar **Dapodik**: NISN, NIK, NIS/NIPD, nama lengkap, nama panggilan, tempat & tanggal lahir, jenis kelamin, agama, kewarganegaraan, tempat tinggal, transportasi, anak ke-, no HP, alamat lengkap (RT/RW, desa, kecamatan, kabupaten), nomor akta, KK, penerima KIP/PIP/KPS/PKH.
- Data pendukung: tanggal masuk, asal sekolah, jalur masuk, **status keluarga** (Yatim / Yatim-Piatu / Dhuafa / Umum), **status santri** (Aktif / Khusus / Mutasi Keluar / Lulus / Wafat / Drop Out).
- Foto santri (opsional).
- **Upload dokumen santri**: berkas per santri dengan jenis dokumen (KK, akta, ijazah, SKL, dll.) — file tersimpan di Supabase Storage, terdaftar di halaman detail santri.
- Halaman detail santri berisi seluruh data, histori, dan dokumen.

### 4. Field konfigurabel
- Superadmin menambah **field kustom** (teks/angka/pilihan/tanggal) dan menyembunyikan field bawaan yang tak terpakai — sebagai jaring pengaman bila ada field tertinggal/tidak dipakai.

### 5. Kamar, kelas & tahun ajaran
- **Kamar**: daftar dinamis (nomor tidak terpaku 1–9), opsional asrama (Putra/Putri) + kapasitas.
- **Kelas**: tingkat (7/8/9) + rombel (A/B/…) + wali kelas; sejarah per tahun.
- **Tahun Ajaran Aktif**: setting di halaman pengaturan; konteks dashboard/rekap.
- Satu santri = satu kamar + satu kelas (berbeda dari dimensi lain). Pergantian kamar/kelas terekam sebagai **histori bertanggal efektif**.

### 6. Wali Santri
- Entitas terpisah yang menaungi satu atau lebih santri (kakak-beradik). Menghindari duplikasi dan satu edit berlaku untuk semua anak.
- Data: nama ayah, nama ibu, nama wali, pekerjaan, penghasilan, alamat, no HP.

### 7. Histori & audit log
- **Histori santri**: status, perpindahan kamar/kelas, perubahan penting — otomatis tercatat "dari apa ke apa, kapan".
- **Audit log** (append-only, khusus Superadmin): semua perubahan data santri & wali, import Excel, perubahan pengguna/peran/izin/field — siapa, apa, dari ke, kapan.
- **Catatan Pembaruan (Apa yang Baru)**: Halaman khusus yang menampilkan riwayat pembaruan aplikasi secara otomatis berdasarkan aktivitas pengembangan, disajikan dengan bahasa yang mudah dipahami oleh pengguna.

### 8. Import Excel
- Template siap unduh; import data santri + wali dari Excel.
- Log hasil import (berhasil/gagal/baris bermasalah) masuk audit log.

### 9. Cetak & ekspor
- **Kartu santri** (dengan foto), **kutipan buku induk** (resmi per santri), **rekap per kamar/kelas** (tabel), **ekspor Excel** seluruh data.
- Cetak/ekspor **menghormati filter aktif** (mis. hanya santri putra, hanya status keluarga Yatim).

### 10. Pencarian & filter
- Kata kunci: nama, NISN, NIK, NIS.
- Filter: kamar, kelas, status santri, status keluarga, jenis kelamin, asal daerah.
- Tampilan daftar (tabel) + halaman detail.

### 11. Tema
- Multi-tema dengan daisyUI (bawaan + tema kustom), bukan sekadar dark/light.

## Persyaratan non-fungsional

- **Desktop-first**, tetap responsive di HP (cek data cepat tanpa buka laptop).
- Cepat: ratusan santri, <10 akses bersamaan — beban ringan.
- Keamanan: otoritas akhir di database (Row Level Security Supabase); NIK/NISN & dokumen sensitif tidak bocor ke yang tak berhak.
- Tersedia online 24/7 (Cloudflare Pages + Supabase), akses dari mana saja.
- Bahasa antarmuka: Indonesia.

## Arsitektur (ringkas)

- **Frontend**: SvelteKit + TypeScript, Tailwind CSS v4 + daisyUI (multi-tema), dideploy ke **Cloudflare Pages** (`adapter-cloudflare`), kode di GitHub.
- **Backend/data**: **Supabase** — Postgres (skema lengkap), Auth, Storage (foto & dokumen), RLS untuk keamanan per peran.
- Deployment otomatis via integrasi GitHub → Cloudflare Pages.

### Garis besar skema data
- `users_profiles` (link ke Supabase auth, `peran`, data personal)
- `roles_permissions` / `permissions_matrix` (aturan izin runtime)
- `santri` (field bawaan; `kamar_id`, `kelas_id`, `status_*`, foto; nilai field kustom di JSONB)
- `custom_fields` (metadata field kustom)
- `wali_santri` (entitas wali)
- `kamar` (nomor, asrama, kapasitas)
- `kelas` (tingkat, rombel, wali kelas)
- `status_history` (histori bertanggal efektif)
- `santri_documents` (jenis dokumen, file di Storage)
- `audit_logs` (append-only)

## Fase lanjutan (di luar v1)

- Sinkron/Dapodik (API)
- SSO lintas aplikasi guru
- Import akun via Excel
- Filter/rekap historis per tahun ajaran lampau

## Referensi

- Glosarium & istilah: `CONTEXT.md`
- Keputusan arsitektur: `docs/adr/0001-…` s.d. `docs/adr/0004-…`