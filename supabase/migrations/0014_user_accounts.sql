-- 0014_user_accounts.sql
-- 1. Tambah kolom username & email ke profiles
alter table profiles add column if not exists username text;
alter table profiles add column if not exists email text;

-- 2. Update trigger: copy email & username dari auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, peran, email, username)
  values (
    new.id,
    'asatidz',
    new.email,
    coalesce(new.raw_user_meta_data->>'username', null)
  )
  on conflict do nothing;
  return new;
end
$$;

-- 3. Tambah unique constraint pada username (jika belum ada)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_key'
  ) then
    alter table profiles add constraint profiles_username_key unique (username);
  end if;
end $$;

-- 4. Seed setting: izin staff TU membuat akun
insert into settings (key, value) values
  ('allow_admin_tu_create_users', 'false')
on conflict (key) do nothing;
