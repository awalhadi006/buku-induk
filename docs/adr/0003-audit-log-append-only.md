# 0003 — Audit log append-only untuk semua mutasi data

Semua perubahan — data santri, wali santri, import Excel, pengguna/peran/izin, dan konfigurasi field — dicatat ke satu tabel `audit_logs`: aktor, tindakan, entitas, sebelum/sesudah, waktu. Baris log tidak pernah diubah/dihapus oleh aplikasi; hanya bisa dibaca Superadmin.

Dipilih demi transparansi "siapa mengubah apa, dari apa ke apa, kapan" dan mendukung skenario perbaikan data oleh Wali Kamar/Kelas. Konsekuensi: setiap mutasi menambah satu baris log (murah, diterima untuk skala ratusan santri).