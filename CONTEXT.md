# Buku Induk Santri

Aplikasi web master data santri (pengganti buku induk fisik) untuk pesantren. Mengarsipkan data santri lengkap, riwayat perubahan, dokumen, dan rekapitulasi hasil filter sehingga data bisa dicek kapan saja dari mana saja. Bukan sistem operasional (SPP, absensi, nilai — di aplikasi terpisah).

## Actor & peran

**Superadmin**:
Pemegang kendali penuh: kelola pengguna, peran & izin, konfigurasi field, tahun ajaran aktif, dan satu-satunya pembaca audit log. Sekaligus berfungsi seperti Admin TU.
_Avoid_: Owner, admin sistem

**Admin TU**:
Staf tata usaha yang mengelola data santri dan wali santri (input, perbaiki, cetak, ekspor, import). Tidak bisa mengelola pengguna/izin/field.
_Avoid_: Staf, operator sekolah

**Wali Kamar**:
Pengasuh/penanggung jawab sebuah kamar; melihat detail santri kamarnya dan dapat memperbaiki data santri itu (berdasarkan konfirmasi TU).
_Avoid_: Pengurus kamar

**Wali Kelas**:
Pengasuh/penanggung jawab sebuah kelas; sama seperti Wali Kamar tetapi cakupannya kelas.
_Avoid_: Guru kelas

**Asatidz/Asatidzah**:
Pendidik di pesantren; hanya melihat dashboard angka rekap, tidak melihat detail data santri.
_Avoid_: Guru, ustadz

## Data santri & keluarga

**Santri**:
Murid yang tinggal dan belajar di pesantren; unit utama data yang dicatat (identitas Dapodik, status keluarga, status santri, histori, dokumen).

**Wali Santri**:
Orang tua/wali yang bertanggung jawab atas santri; satu entitas bisa menaungi beberapa santri (kakak-beradik).
_Avoid_: Wali murid, ortu, orang tua & wali

**Status Santri**:
Keadaan keaktifan santri yang menentukan pengelompokan arsip: Aktif, Khusus, Mutasi Keluar, Lulus, Wafat, Drop Out.
_Avoid_: Keterangan santri

**Status Keluarga**:
Klasifikasi sosial keluarga santri — Yatim, Yatim-Piatu, Dhuafa, Umum — yang relevan untuk bantuan/beasiswa.

**Field Kustom**:
Kolom data tambahan yang dibuat Superadmin bila field bawaan belum cukup; tipe teks, angka, pilihan, atau tanggal.

**Dokumen Santri**:
Berkas lampiran per santri (KK, akta, ijazah, SKL, dsb.) beserta fotonya.
_Avoid_: Lampiran

## Struktur & riwayat

**Kamar**:
Ruang tinggal santri di asrama; salah satu dimensi pengelompokan santri. Dinomori dinamis (tidak selalu 1–9, bisa kurang/bisa lebih) dan boleh punya asrama (mis. Putra/Putri) serta kapasitas.

**Kelas**:
Rombongan belajar santri pada satu tingkat dan tahun ajaran (mis. 7A, 8B). Bahan: gabungan **Tingkat** (7/8/9) + **Rombel** (A/B/…).
_Avoid_: Tingkat kelas

**Tahun Ajaran Aktif**:
Setting aplikasi yang menandai tahun ajaran berjalan; konteks untuk dashboard dan rekap "saat ini".

**Histori**:
Catatan perubahan berdasar tanggal efektif (mis. pindah kamar/kelas, perubahan status); setiap perubahan data juga masuk audit log.

## Mekanisme

**Audit Log**:
Riwayat perubahan data yang append-only (tidak bisa diubah/dihapus) — mencatat siapa mengubah apa, dari apa ke apa, kapan. Hanya dibaca Superadmin.

**Peran & Izin**:
Menu Superadmin untuk mengubah matriks izin per peran saat runtime (mis. menyalakan/mematikan hak edit Wali Kamar).

**Import Excel**:
Memasukkan data santri dari file Excel menggunakan template yang disediakan aplikasi. (Sinkron otomatis ke Dapodik termasuk fase lanjutan.)