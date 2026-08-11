# 0004 — Matriks izin peran runtime + Row Level Security (RLS)

Peran: Superadmin, Admin TU, Wali Kamar, Wali Kelas, Asatidz. Matriks izin disimpan sebagai pengaturan (bisa diubah Superadmin saat runtime di menu **Peran & Izin**) — misal menyalakan/mematikan hak edit Wali Kamar.

Pengaman akhir berada di database: **RLS** Supabase membatasi baris santri yang boleh dilihat/diubah sesuai scope peran (Wali Kamar hanya kamarnya, Wali Kelas hanya kelasnya), sehingga data sensitif tidak bocor lewat query langsung.

Dipilih karena:
- Aturan pondok sering berubah (mis. "wali kamar boleh edit") tanpa perlu redeploy.
- Keamanan NIK/NISN tidak bergantung pada kerapian UI.

Catatan: hak edit Wali Kamar/Kelas default ON (perbaiki salah input atas konfirmasi TU), tapi edit **NIK/NISN** default admin saja — keduanya toggle di Peran & Izin.