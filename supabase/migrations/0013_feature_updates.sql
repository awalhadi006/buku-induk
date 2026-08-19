-- 0013_feature_updates.sql
-- 1. Hapus kolom kapasitas dari kamar (kapasitas menyesuaikan data santri yang masuk)
alter table kamar drop column if exists kapasitas;

-- 2. Hapus kolom nipd dari santri (sama dengan NIS)
alter table santri drop column if exists nipd;

-- 3. RLS gdrive_creds: izinkan admin_tu untuk membaca status koneksi (read-only)
drop policy if exists gdrive_creds_read_admin on gdrive_creds;
create policy gdrive_creds_read_admin on gdrive_creds for select
  using (public.current_peran() in ('superadmin', 'admin_tu'));

-- 4. Seed settings untuk identitas sekolah
insert into settings (key, value) values
  ('school_name', 'Buku Induk'),
  ('school_logo_url', '')
on conflict (key) do nothing;
