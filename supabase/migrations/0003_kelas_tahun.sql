-- 0003_kelas_tahun: dimensi tahun ajaran pada kelas untuk sejarah per tahun (PRD #5/#7).
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

alter table kelas add column if not exists tahun_ajaran text;
comment on column kelas.tahun_ajaran is 'Tahun ajaran kelas (mis. 2025/2026); memungkinkan sejarah kelas per tahun.';

-- Baris legacy (tanpa tahun) diberi nilai placeholder agar constraint unik tetap konsisten.
update kelas set tahun_ajaran = '—' where tahun_ajaran is null;

-- Ubah constraint unik menjadi (tingkat, rombel, tahun_ajaran) agar satu kelas
-- (mis. 7A) bisa dibuat ulang tiap tahun ajaran tanpa bentrok.
alter table kelas drop constraint if exists kelas_tingkat_rombel_key;
alter table kelas add constraint kelas_tingkat_rombel_tahun_key unique (tingkat, rombel, tahun_ajaran);
