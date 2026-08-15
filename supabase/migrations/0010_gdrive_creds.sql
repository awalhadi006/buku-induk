-- 0010_gdrive_creds: menyimpan token OAuth Google Drive (akun belajar.id) untuk unggah foto santri.
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

create table if not exists gdrive_creds (
  id integer primary key default 1,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  folder_id text,
  connected_at timestamptz
);
comment on table gdrive_creds is 'Token OAuth Google Drive (akun belajar.id) untuk unggah foto santri. Hanya satu baris (id=1).';

alter table gdrive_creds enable row level security;

drop policy if exists gdrive_creds_all on gdrive_creds;
create policy gdrive_creds_all on gdrive_creds for all
  using (public.current_peran() = 'superadmin')
  with check (public.current_peran() = 'superadmin');
