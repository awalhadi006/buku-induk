-- 0001_init: skema inti Buku Induk Santri + RLS (ADR-0002, ADR-0003, ADR-0004)
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

create extension if not exists pgcrypto;

-- =========================================================
-- TABEL MASTER: kamar & kelas
-- =========================================================
create table if not exists kamar (
  id bigint generated always as identity primary key,
  nomor integer not null,
  asrama text,
  kapasitas integer,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nomor)
);
comment on table kamar is 'Kamar santri: nomor dinamis (tidak terpaku 1-9), boleh punya asrama & kapasitas.';

create table if not exists kelas (
  id bigint generated always as identity primary key,
  tingkat text not null,
  rombel text not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tingkat, rombel)
);
comment on table kelas is 'Kelas santri = gabungan tingkat (7/8/9) + rombel (A/B/...).';

-- =========================================================
-- PROFIL PENGGUNA (satu baris per akun auth Supabase)
-- =========================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  peran text not null default 'asatidz' check (peran in ('superadmin','admin_tu','wali_kamar','wali_kelas','asatidz')),
  nama text,
  kamar_id bigint references kamar (id),
  kelas_id bigint references kelas (id),
  created_at timestamptz not null default now()
);
comment on table profiles is 'Peran & scope akses pengguna; dibuat otomatis saat akun auth dibuat.';

-- =========================================================
-- PERIZINAN RUNTIME (ADR-0004: matriks izin bisa diubah Superadmin)
-- =========================================================
create table if not exists permissions (
  role text primary key,
  abilities text[] not null default '{}'
);
comment on table permissions is 'Matriks izin per peran (runtime). Kemampuan: santri.view, santri.detail, santri.create, santri.edit, santri.edit_nik, santri.delete, wali.view, wali.create, wali.edit, wali.delete, export, import, dashboard, users.manage, roles.manage, fields.manage, ta.manage, audit.view.';

-- =========================================================
-- DATA SANTRI & WALI
-- =========================================================
create table if not exists wali_santri (
  id uuid primary key default gen_random_uuid(),
  nama_ayah text,
  nama_ibu text,
  nama_wali text,
  pekerjaan_ayah text,
  pekerjaan_ibu text,
  penghasilan text,
  alamat text,
  no_hp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table wali_santri is 'Entitas wali terpisah; satu wali bisa menaungi beberapa santri (kakak-beradik).';

create table if not exists santri (
  id uuid primary key default gen_random_uuid(),
  nisn text,
  nik text,
  nis text,
  nipd text,
  nama_lengkap text not null,
  nama_panggilan text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text check (jenis_kelamin in ('L','P')),
  agama text,
  kewarganegaraan text default 'Indonesia',
  tempat_tinggal text,
  transportasi text,
  anak_ke integer,
  no_hp text,
  alamat text,
  rt text,
  rw text,
  desa text,
  kecamatan text,
  kabupaten text,
  no_akta text,
  no_kk text,
  bantuan_kip text,
  status_keluarga text check (status_keluarga in ('yatim','yatim_piatu','dhuafa','umum')),
  status_santri text not null default 'aktif' check (status_santri in ('aktif','khusus','mutasi_keluar','lulus','wafat','drop_out')),
  tanggal_masuk date,
  asal_sekolah text,
  jalur_masuk text,
  kamar_id bigint references kamar (id),
  kelas_id bigint references kelas (id),
  wali_santri_id uuid references wali_santri (id),
  foto_url text,
  custom jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table santri is 'Data santri: field identitas Dapodik + status keluarga + status santri + kamar/kelas + nilai field kustom (JSONB, ADR-0002).';

create index if not exists idx_santri_kamar on santri (kamar_id);
create index if not exists idx_santri_kelas on santri (kelas_id);
create index if not exists idx_santri_wali on santri (wali_santri_id);
create index if not exists idx_santri_nama on santri (lower(nama_lengkap));

-- =========================================================
-- FIELD KUSTOM & DOKUMEN (ADR-0002)
-- =========================================================
create table if not exists custom_fields (
  id bigint generated always as identity primary key,
  nama text not null unique,
  label text not null,
  tipe text not null check (tipe in ('text','number','select','date')),
  opsi jsonb not null default '[]',
  aktif boolean not null default true,
  urutan integer not null default 0
);
comment on table custom_fields is 'Field kustom yang dibuat Superadmin; nilai santri tersimpan di santri.custom.';

create table if not exists santri_documents (
  id uuid primary key default gen_random_uuid(),
  santri_id uuid not null references santri (id) on delete cascade,
  jenis text not null,
  nama_file text,
  file_url text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now()
);
comment on table santri_documents is 'Dokumen per santri (KK, akta, ijazah, SKL, dll); file di Supabase Storage.';

create index if not exists idx_documents_santri on santri_documents (santri_id);

-- =========================================================
-- HISTORI & AUDIT (ADR-0003)
-- =========================================================
create table if not exists status_history (
  id bigint generated always as identity primary key,
  santri_id uuid not null references santri (id) on delete cascade,
  jenis text not null check (jenis in ('kamar','kelas','status_santri','status_keluarga','wali')),
  nilai_lama text,
  nilai_baru text,
  tanggal_efektif date not null default current_date,
  created_by uuid,
  created_at timestamptz not null default now()
);
comment on table status_history is 'Histori santri bertanggal efektif (pindah kamar/kelas, ganti status), diisi otomatis oleh trigger.';

create index if not exists idx_history_santri on status_history (santri_id);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
comment on table audit_logs is 'Riwayat perubahan append-only: siapa mengubah apa, dari apa ke apa, kapan. Hanya dibaca Superadmin.';

create index if not exists idx_audit_created on audit_logs (created_at desc);

-- =========================================================
-- SETTING APLIKASI
-- =========================================================
create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values ('tahun_ajaran_aktif', '') on conflict do nothing;

-- =========================================================
-- SEED IZIN DEFAULT (matriks PRD; Superadmin ubah via aplikasi)
-- =========================================================
insert into permissions (role, abilities) values
  ('superadmin', array['santri.view','santri.detail','santri.create','santri.edit','santri.edit_nik','santri.delete','wali.view','wali.create','wali.edit','wali.delete','export','import','dashboard','users.manage','roles.manage','fields.manage','ta.manage','audit.view']),
  ('admin_tu',   array['santri.view','santri.detail','santri.create','santri.edit','santri.edit_nik','santri.delete','wali.view','wali.create','wali.edit','wali.delete','export','import','dashboard']),
  ('wali_kamar', array['santri.view','santri.detail','santri.edit','export','dashboard']),
  ('wali_kelas', array['santri.view','santri.detail','santri.edit','export','dashboard']),
  ('asatidz',    array['dashboard'])
on conflict (role) do nothing;

-- =========================================================
-- FUNGSI BANTU RLS
-- =========================================================
create or replace function public.current_peran()
returns text language sql stable security definer set search_path = public as $$
  select peran from public.profiles where id = auth.uid()
$$;

create or replace function public.current_kamar_id()
returns bigint language sql stable security definer set search_path = public as $$
  select kamar_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_kelas_id()
returns bigint language sql stable security definer set search_path = public as $$
  select kelas_id from public.profiles where id = auth.uid()
$$;

create or replace function public.has_permission(p_ability text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.permissions
    where role = public.current_peran() and p_ability = any(abilities)
  )
$$;

create or replace function public.can_view_santri()
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() = 'wali_kamar' and public.has_permission('santri.view'))
    or (public.current_peran() = 'wali_kelas' and public.has_permission('santri.view'))
$$;

-- =========================================================
-- TRIGGER: profil dibuat otomatis saat akun auth dibuat
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, peran) values (new.id, 'asatidz') on conflict do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- TRIGGER: pelindung NIK/NISN (edit hanya bila izin santri.edit_nik)
-- =========================================================
create or replace function public.guard_nik_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null
     and (old.nik is distinct from new.nik or old.nisn is distinct from new.nisn)
     and public.current_peran() <> 'superadmin'
     and not public.has_permission('santri.edit_nik') then
    raise exception 'Mengubah NIK/NISN memerlukan izin santri.edit_nik';
  end if;
  return new;
end
$$;

drop trigger if exists guard_nik_edit on santri;
create trigger guard_nik_edit
before update on santri
for each row execute function public.guard_nik_edit();

-- =========================================================
-- TRIGGER: histori otomatis (pindah kamar/kelas, ganti status/wali)
-- =========================================================
create or replace function public.log_status_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.kamar_id is distinct from new.kamar_id then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, created_by)
    values (new.id, 'kamar', old.kamar_id::text, new.kamar_id::text, auth.uid());
  end if;
  if old.kelas_id is distinct from new.kelas_id then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, created_by)
    values (new.id, 'kelas', old.kelas_id::text, new.kelas_id::text, auth.uid());
  end if;
  if old.status_santri is distinct from new.status_santri then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, created_by)
    values (new.id, 'status_santri', old.status_santri, new.status_santri, auth.uid());
  end if;
  if old.status_keluarga is distinct from new.status_keluarga then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, created_by)
    values (new.id, 'status_keluarga', old.status_keluarga, new.status_keluarga, auth.uid());
  end if;
  if old.wali_santri_id is distinct from new.wali_santri_id then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, created_by)
    values (new.id, 'wali', old.wali_santri_id::text, new.wali_santri_id::text, auth.uid());
  end if;
  return new;
end
$$;

drop trigger if exists log_status_history on santri;
create trigger log_status_history
after update on santri
for each row execute function public.log_status_history();

-- =========================================================
-- TRIGGER: audit otomatis santri & wali (ADR-0003)
-- =========================================================
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, after)
    values (auth.uid(), 'create', tg_table_name, new.id::text, to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
    values (auth.uid(), 'update', tg_table_name, new.id::text, to_jsonb(old), to_jsonb(new));
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, before)
    values (auth.uid(), 'delete', tg_table_name, old.id::text, to_jsonb(old));
  end if;
  return new;
end
$$;

drop trigger if exists audit_santri on santri;
create trigger audit_santri
after insert or update or delete on santri
for each row execute function public.audit_row();

drop trigger if exists audit_wali on wali_santri;
create trigger audit_wali
after insert or update or delete on wali_santri
for each row execute function public.audit_row();

-- =========================================================
-- ROW LEVEL SECURITY (ADR-0004)
-- =========================================================
alter table profiles enable row level security;
alter table permissions enable row level security;
alter table kamar enable row level security;
alter table kelas enable row level security;
alter table wali_santri enable row level security;
alter table santri enable row level security;
alter table custom_fields enable row level security;
alter table santri_documents enable row level security;
alter table status_history enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- profiles
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or public.current_peran() = 'superadmin');
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert
  with check (id = auth.uid());
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = auth.uid() or public.current_peran() = 'superadmin')
  with check (id = auth.uid() or public.current_peran() = 'superadmin');

-- permissions: dibaca semua login, ditulis superadmin
drop policy if exists permissions_select on permissions;
create policy permissions_select on permissions for select
  using (auth.uid() is not null);
drop policy if exists permissions_write on permissions;
create policy permissions_write on permissions for all
  using (public.current_peran() = 'superadmin')
  with check (public.current_peran() = 'superadmin');

-- kamar & kelas: dibaca semua login, diubah admin penuh
drop policy if exists kamar_select on kamar;
create policy kamar_select on kamar for select using (auth.uid() is not null);
drop policy if exists kamar_write on kamar;
create policy kamar_write on kamar for all
  using (public.current_peran() in ('superadmin','admin_tu'))
  with check (public.current_peran() in ('superadmin','admin_tu'));

drop policy if exists kelas_select on kelas;
create policy kelas_select on kelas for select using (auth.uid() is not null);
drop policy if exists kelas_write on kelas;
create policy kelas_write on kelas for all
  using (public.current_peran() in ('superadmin','admin_tu'))
  with check (public.current_peran() in ('superadmin','admin_tu'));

-- santri
drop policy if exists santri_select on santri;
create policy santri_select on santri for select
  using (
    public.can_view_santri()
    or (public.current_peran() = 'wali_kamar' and public.has_permission('santri.view') and kamar_id = public.current_kamar_id())
    or (public.current_peran() = 'wali_kelas' and public.has_permission('santri.view') and kelas_id = public.current_kelas_id())
  );

drop policy if exists santri_insert on santri;
create policy santri_insert on santri for insert
  with check (public.current_peran() in ('superadmin','admin_tu') and public.has_permission('santri.create'));

drop policy if exists santri_update on santri;
create policy santri_update on santri for update
  using (
    public.can_view_santri()
    or (public.current_peran() = 'wali_kamar' and public.has_permission('santri.edit') and kamar_id = public.current_kamar_id())
    or (public.current_peran() = 'wali_kelas' and public.has_permission('santri.edit') and kelas_id = public.current_kelas_id())
  )
  with check (
    public.can_view_santri()
    or (public.current_peran() = 'wali_kamar' and public.has_permission('santri.edit') and kamar_id = public.current_kamar_id())
    or (public.current_peran() = 'wali_kelas' and public.has_permission('santri.edit') and kelas_id = public.current_kelas_id())
  );

drop policy if exists santri_delete on santri;
create policy santri_delete on santri for delete
  using (public.current_peran() in ('superadmin','admin_tu') and public.has_permission('santri.delete'));

-- wali_santri: scope mengikuti santri yang bisa dilihat/dikelola
drop policy if exists wali_select on wali_santri;
create policy wali_select on wali_santri for select
  using (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() = 'wali_kamar' and exists (select 1 from santri s where s.wali_santri_id = wali_santri.id and s.kamar_id = public.current_kamar_id()))
    or (public.current_peran() = 'wali_kelas' and exists (select 1 from santri s where s.wali_santri_id = wali_santri.id and s.kelas_id = public.current_kelas_id()))
  );

drop policy if exists wali_insert on wali_santri;
create policy wali_insert on wali_santri for insert
  with check (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('wali.edit'))
  );

drop policy if exists wali_update on wali_santri;
create policy wali_update on wali_santri for update
  using (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('wali.edit'))
  )
  with check (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('wali.edit'))
  );

drop policy if exists wali_delete on wali_santri;
create policy wali_delete on wali_santri for delete
  using (public.current_peran() in ('superadmin','admin_tu'));

-- custom_fields: dibaca semua login, ditulis superadmin
drop policy if exists custom_fields_select on custom_fields;
create policy custom_fields_select on custom_fields for select using (auth.uid() is not null);
drop policy if exists custom_fields_write on custom_fields;
create policy custom_fields_write on custom_fields for all
  using (public.current_peran() = 'superadmin')
  with check (public.current_peran() = 'superadmin');

-- santri_documents
drop policy if exists documents_select on santri_documents;
create policy documents_select on santri_documents for select
  using (exists (select 1 from santri s where s.id = santri_documents.santri_id and public.can_view_santri()));

drop policy if exists documents_insert on santri_documents;
create policy documents_insert on santri_documents for insert
  with check (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('santri.edit'))
  );

drop policy if exists documents_update on santri_documents;
create policy documents_update on santri_documents for update
  using (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('santri.edit'))
  )
  with check (
    public.current_peran() in ('superadmin','admin_tu')
    or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('santri.edit'))
  );

drop policy if exists documents_delete on santri_documents;
create policy documents_delete on santri_documents for delete
  using (public.current_peran() in ('superadmin','admin_tu'));

-- status_history
drop policy if exists history_select on status_history;
create policy history_select on status_history for select
  using (exists (select 1 from santri s where s.id = status_history.santri_id and public.can_view_santri()));

drop policy if exists history_insert on status_history;
create policy history_insert on status_history for insert
  with check (auth.uid() is not null);

-- audit_logs: hanya superadmin yang membaca; siapa pun bisa menulis (oleh trigger/aplikasi)
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs for select
  using (public.current_peran() = 'superadmin');
drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs for insert
  with check (auth.uid() is not null);

-- settings: dibaca semua login, ditulis superadmin
drop policy if exists settings_select on settings;
create policy settings_select on settings for select using (auth.uid() is not null);
drop policy if exists settings_write on settings;
create policy settings_write on settings for all
  using (public.current_peran() = 'superadmin')
  with check (public.current_peran() = 'superadmin');

-- =========================================================
-- STORAGE (foto & dokumen santri; ADR-0002/AD-0004 bawa RLS)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('santri', 'santri', false)
on conflict (id) do nothing;

drop policy if exists storage_select on storage.objects;
create policy storage_select on storage.objects for select
  using (bucket_id = 'santri' and auth.uid() is not null and public.can_view_santri());

drop policy if exists storage_insert on storage.objects;
create policy storage_insert on storage.objects for insert
  with check (
    bucket_id = 'santri' and auth.uid() is not null
    and (public.current_peran() in ('superadmin','admin_tu')
         or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('santri.edit')))
  );

drop policy if exists storage_delete on storage.objects;
create policy storage_delete on storage.objects for delete
  using (bucket_id = 'santri'
         and (public.current_peran() in ('superadmin','admin_tu')
              or (public.current_peran() in ('wali_kamar','wali_kelas') and public.has_permission('santri.edit'))));