# Buku Induk Santri

Website master data santri (arsip buku induk digital) untuk pesantren. Dokumentasi: [`PRD.md`](./PRD.md), [`CONTEXT.md`](./CONTEXT.md), [`docs/adr/`](./docs/adr/).

## Stack

- **Frontend**: SvelteKit + TypeScript, Tailwind CSS v4 + daisyUI (komponen), tema custom (`bi-dark`/`bi-light`)
- **Hosting**: Cloudflare Pages (`@sveltejs/adapter-cloudflare`)
- **Backend/data**: Supabase (Postgres + Auth + Storage + RLS)

## Fitur

Fitur terbaru (sesuai PRD v1 lengkap):

1. **Autentikasi & akun** — Login username/password Supabase Auth, ganti password sendiri, Superadmin reset, akun dibuat manual oleh Superadmin
2. **Dashboard rekapitulasi** — Kartu angka + chart sederhana, metrik konfigurabel (total santri, per status, jenis kelamin, kamar, kelas, asal daerah), asatidz hanya melihat halaman ini
3. **Kelola data santri** — CRUD lengkap field identitas Dapodik (NISN, NIK, NIS/NIPD, nama lengkap, nama panggilan, TTL, jenis kelamin, agama, kewarganegaraan, tempat tinggal, transportasi, anak ke-, no HP, alamat lengkap, nomor akta, KK, penerima bantuan), status keluarga (Yatim/Yatim-Piatu/Dhuafa/Umum), status santri (Aktif/Khusus/Mutasi Keluar/Lulus/Wafat/Drop Out), foto santri opsional, upload dokumen santri (KK, akta, ijazah, SKL, dll.) ke Supabase Storage
4. **Field konfigurabel** — Superadmin menambah field kustom (teks/angka/pilihan/tanggal) dan menyembunyikan field bawaan tidak dipakai
5. **Auto-Generator NIS** — Superadmin konfigurasi pola NIS (`{TAHUN}.{JENJANG}.{NO}`), generate otomatis saat santri baru/di-trigger manual, NIS unik, validasi pola
6. **Kamar, kelas & tahun ajaran** — Kamar dinamis (nomor tidak terpaku 1–9), opsional asrama + kapasitas; Kelas: tingkat + rombel + wali kelas; Tahun ajaran aktif; Satu santri = satu kamar + satu kelas; Riwayat pergantian kamar/kelas sebagai histori bertanggal efektif; Kenaikan kelas massal & Kelulusan massal
7. **Wali Santri** — Entitas terpisah manaingi satu atau lebih santri (kakak-beradik), data: nama ayah/ibu/wali, pekerjaan, penghasilan, alamat, no HP
8. **Direktori Alumni** — Halaman khusus menampilkan santri status Lulus, difilter tahun kelulusan & kelas asal, ekspor Excel
9. **Histori & audit log** — Histori perubahan data bertanggal efektif (append-only, hanya Superadmin baca), mencatat siapa mengubah apa dari apa ke apa kapan
10. **Import Excel** — Template siap unduh, import santri + wali dari Excel, log hasil import masuk audit log
11. **Cetak & ekspor** — Kartu santri (dengan foto), kutipan buku induk, rekap per kamar/kelas (tabel), ekspor Excel seluruh data, menghormati filter aktif
12. **Pencarian & filter** — Kata kunci: nama, NISN, NIK, NIS; Filter: kamar, kelas, status santri, status keluarga, jenis kelamin, asal daerah; Tampilan daftar tabel + halaman detail
13. **Tema** — Dark/light custom (`bi-dark`/`bi-light`) via daisyUI komponen, toggle di header

## Pengembangan lokal

1. Salin `.env.example` ke `.env`, sesuaikan `PUBLIC_SUPABASE_URL` dan `PUBLIC_SUPABASE_ANON_KEY`.
2. Jalankan migrasi di Supabase Dashboard → SQL Editor: salin isi `supabase/migrations/0001_init.sql` hingga `0016_login_lookup_email.sql`.
3. Jalankan `npm run dev -- --open`.

## Deploy

Cloudflare Pages terhubung ke repo GitHub. Variabel env (di Pages → Settings → Environment):

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret, untuk import/audit log)

## Keamanan

- Kunci `sb_publishable_...` aman di repo publik (didesain begitu).
- Data santri di database Supabase (dengan RLS), tidak di bundle/repo.
- Semua operasi yang mengakses data sensitif di server-side (hooks, loaders).

## Status

v1.0: lengkap fitur autentikasi, CRUD santri/wali, dashboard rekap, kamar/kelas/tahun ajaran, wali santri, direktori alumni, histori & audit log, import Excel, cetak/ekspor, pencarian & filter, tema multi, field konfigurabel, auto-generator NIS.

## Jalur pengembangan selanjutnya (Fase lanjutan)

- Sinkron/Dapodik (API)
- SSO lintas aplikasi guru
- Import akun via Excel
- Filter/rekap historis per tahun ajaran lampau