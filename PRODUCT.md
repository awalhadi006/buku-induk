# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Peran dan situasi pemakaian (sumber utama: CONTEXT.md):

- **Superadmin** (sekaligus berperan sebagai Admin TU): kendali penuh — pengguna, peran & izin, field kustom, tahun ajaran aktif, satu-satunya pembaca audit log.
- **Admin TU**: staf tata usaha yang mengelola data santri & wali (input, perbaiki, cetak, ekspor, import); bekerja intensif dari **desktop** di kantor TU.
- **Wali Kamar** / **Wali Kelas**: melihat detail santri binaannya dan mengajukan perbaikan data (berdasarkan konfirmasi TU).
- **Asatidz/Asatidzah**: hanya melihat dashboard angka rekap, tanpa detail data santri; umumnya mengakses dari **HP**.

Pemakaian bersifat **campuran**: Admin TU di desktop, pengasuh dan pendidik dari ponsel — antarmuka harus nyaman di kedua kelas perangkat.

## Product Purpose

Aplikasi web **buku induk santri digital** untuk pesantren: pengganti buku induk fisik sebagai arsip induk data santri — identitas (termasuk format Dapodik), status keluarga, status santri, histori perubahan, dokumen, dan rekapitulasi hasil filter — agar data dapat dicek kapan saja dari mana saja. Bukan sistem operasional: SPP, absensi, dan nilai sengaja dikelola di aplikasi terpisah. Keberhasilan berarti data selalu mutakhir, terlacak siapa mengubah apa, dan rekap dapat diandalkan sebagai "keadaan saat ini".

## Positioning

Arsip induk tunggal yang dapat diaudit: tidak sekadar menyimpan data santri, tetapi mempertahankan **histori berbasis tanggal efektif** dan **audit log append-only**, sehingga setiap nilai masa lalu dapat dibuktikan — sesuatu yang buku fisik maupun spreadsheet tidak menjamin.

## Operating Context

- Lingkungan **pesantren**: santri tinggal di **kamar** asrama (dinamis: nomor/jumlah/kapasitas berubah, bisa Putra/Putri), belajar per **kelas** (Tingkat 7/8/9 + Rombel, terikat **tahun ajaran aktif**).
- Alur kerja berjenjang: TU memegang pencatatan; wali kamar/kelas mengusulkan perbaikan melalui mekanisme **persetujuan**; superadmin mengatur izin saat runtime lewat matriks peran.
- Dokumen santri (KK, akta, ijazah, SKL, dll.) disimpan sebagai berkas/foto dengan integrasi Google Drive.
- Tahun ajaran aktif menjadi konteks default dashboard dan rekap.

## Capabilities and Constraints

Terconfirma dari kode & dokumentasi:

- CRUD santri & wali santri (satu wali menaungi beberapa santri), status santri (Aktif, Khusus, Mutasi Keluar, Lulus, Wafat, Drop Out), status keluarga (Yatim, Yatim-Piatu, Dhuafa, Umum).
- Field kustom buatan Superadmin (teks, angka, pilihan, tanggal).
- Import Excel via template resmi aplikasi (`src/lib/excel.ts`); ekspor & cetak; sinkronisasi Dapodik termasuk fase lanjutan (direncanakan).
- Audit log **append-only**, hanya dibaca Superadmin — batasan produk yang tidak boleh dilanggar oleh fitur apa pun.
- Izin per peran dapat diubah saat runtime (matriks peran & izin).
- Stack teknis: SvelteKit + Cloudflare (adapter Pages/Workers) + Supabase (lihat ADR 0001).

Belum diputuskan: standar aksesibilitas khusus dan kebutuhan lingkungan (jaringan/device) belum ada requirement terkonfirmasi.

## Brand Commitments

- Nama tampilan aplikasi **dapat diubah lewat menu Pengaturan** — jangan mengeras-kan string "Buku Induk Santri" di UI; ambil dari konfigurasi.
- Aset identitas seperti **logo** digunakan/diunggah sebagai bagian aplikasi dan harus dipertahankan dalam pekerjaan visual.

## Evidence on Hand

- `CONTEXT.md`: glosarium domain resmi (istilah yang harus dipakai dan yang dihindari).
- `docs/adr/0001–0004`: keputusan stack, field santri, audit log append-only, peran & RLS.
- Implementasi incumbent: `src/routes/(app)/{santri,wali,kamar,kelas,rekap,import,gdrive,persetujuan,pengaturan}` dan `src/lib/{excel,permissions,santri}.ts`.
- Template import Excel tersedia dari aplikasi sendiri.

Tidak ada testimoni, studi kasus, atau klaim mitra eksternal — jangan membuatkan.

## Product Principles

1. **Arsip yang bisa dibuktikan.** Histori dan audit log adalah kontrak produk; fitur baru tidak boleh melemahkan ketertelusuran perubahan data.
2. **Satu sumber kebenaran per peran.** Setiap peran melihat tepat sesuai kewenangannya — TU lengkap, pendidik rekap — tanpa jalur pintas yang mengabaikan persetujuan.
3. **Mengikuti struktur pesantren nyata.** Kamar, kelas, dan tahun ajaran bersifat dinamis; UI mengakomodasi perubahan struktur tanpa migrasi manual.
4. **Ringan di desktop maupun HP.** Input massal efisien bagi TU; pengecekan cepat dan jelas bagi pengasuh/pendidik di ponsel.
