-- 0006_tahun_ajaran_table: Tabel master tahun ajaran dan RLS
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

create table if not exists tahun_ajaran (
  id bigint generated always as identity primary key,
  nama text not null unique,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table tahun_ajaran is 'Master tahun ajaran untuk pengelolaan akademik.';

-- Seed data awal jika belum ada
insert into tahun_ajaran (nama, aktif) values 
  ('2025/2026', true),
  ('2026/2027', true)
on conflict (nama) do nothing;

-- RLS
alter table tahun_ajaran enable row level security;

drop policy if exists tahun_ajaran_select on tahun_ajaran;
create policy tahun_ajaran_select on tahun_ajaran for select using (auth.uid() is not null);

drop policy if exists tahun_ajaran_write on tahun_ajaran;
create policy tahun_ajaran_write on tahun_ajaran for all
  using (public.current_peran() = 'superadmin')
  with check (public.current_peran() = 'superadmin');
