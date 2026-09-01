-- 0018_search_indexes: tambah index trigram untuk optimasi pencarian ILIKE '%pattern%'
-- Memperbaiki performa QuickSearch dan pencarian santri/kamar/kelas

create extension if not exists pg_trgm;

-- Index trigram untuk kolom pencarian santri
create index if not exists idx_santri_nisn_trgm on santri using gin (nisn gin_trgm_ops);
create index if not exists idx_santri_nik_trgm on santri using gin (nik gin_trgm_ops);
create index if not exists idx_santri_nis_trgm on santri using gin (nis gin_trgm_ops);

-- Index trigram untuk kamar.nomor (cast ke text)
create index if not exists idx_kamar_nomor_trgm on kamar using gin (CAST(nomor AS text) gin_trgm_ops);

-- Index trigram untuk kelas (gabungan tingkat + rombel)
create index if not exists idx_kelas_tingkat_rombel_trgm on kelas using gin ((tingkat || ' ' || rombel) gin_trgm_ops);

-- Index tambahan untuk nama_lengkap (sudah ada idx_santri_nama tapi tidak trigram)
-- Trigram lebih efektif untuk ILIKE '%pattern%' di tengah string
create index if not exists idx_santri_nama_trgm on santri using gin (nama_lengkap gin_trgm_ops);