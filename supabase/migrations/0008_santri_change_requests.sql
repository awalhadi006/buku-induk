-- 0008_santri_change_requests: alur persetujuan perubahan data santri oleh Wali Kamar/Kelas.
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

create table if not exists santri_change_requests (
  id bigint generated always as identity primary key,
  santri_id uuid not null references santri (id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  requested_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table santri_change_requests is 'Permintaan perubahan data santri dari Wali Kamar/Kelas yang menunggu persetujuan Admin TU/Superadmin.';

create index if not exists idx_cr_santri on santri_change_requests (santri_id);
create index if not exists idx_cr_status on santri_change_requests (status);

-- RLS
alter table santri_change_requests enable row level security;

drop policy if exists cr_select on santri_change_requests;
create policy cr_select on santri_change_requests for select
  using (
    public.current_peran() in ('superadmin','admin_tu')
    or requested_by = auth.uid()
    or (public.current_peran() = 'wali_kamar' and exists (select 1 from santri s where s.id = santri_change_requests.santri_id and s.kamar_id = public.current_kamar_id()))
    or (public.current_peran() = 'wali_kelas' and exists (select 1 from santri s where s.id = santri_change_requests.santri_id and s.kelas_id = public.current_kelas_id()))
  );

drop policy if exists cr_insert on santri_change_requests;
create policy cr_insert on santri_change_requests for insert
  with check (
    public.current_peran() in ('wali_kamar','wali_kelas')
    and requested_by = auth.uid()
  );

drop policy if exists cr_update on santri_change_requests;
create policy cr_update on santri_change_requests for update
  using (public.current_peran() in ('superadmin','admin_tu'))
  with check (public.current_peran() in ('superadmin','admin_tu'));
