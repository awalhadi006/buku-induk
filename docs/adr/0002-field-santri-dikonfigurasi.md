# 0002 — Field data santri dapat dikonfigurasi Superadmin

Field bawaan mengikuti set identitas Dapodik, tetapi Superadmin dapat menambah **field kustom** (teks/angka/pilihan/tanggal) dan menyembunyikan field bawaan yang tak terpakai.

Dipilih karena user takut ada field yang tertinggal atau tidak terpakai, dan ingin mengubah struktur data santri tanpa migrasi database per-field. Metadata field kustom disimpan di tabel `custom_fields`; nilai santri disimpan dalam kolom JSONB di `santri`.

Konsekuensi yang diterima: pencarian/filter pada field kustom lebih terbatas daripada field bawaan.