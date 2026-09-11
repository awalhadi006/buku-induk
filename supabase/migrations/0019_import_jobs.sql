-- 0019_import_jobs.sql
-- Tabel untuk melacak proses import data santri secara async

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) not null,
  file_name text,
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  berhasil integer not null default 0,
  gagal integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table import_jobs is 'Job queue untuk import data santri; memungkinkan progress tracking & polling.';

create index if not exists idx_import_jobs_status on import_jobs (status);
create index if not exists idx_import_jobs_user on import_jobs (user_id);

-- Function untuk update progress secara atomic
create or replace function public.update_import_progress(
  p_job_id uuid,
  p_processed integer,
  p_berhasil integer,
  p_gagal integer
) returns void language sql as $$
  update import_jobs
  set processed_rows = p_processed,
      berhasil = p_berhasil,
      gagal = p_gagal,
      updated_at = now()
  where id = p_job_id;
$$;

-- Function untuk mark job completed
create or replace function public.complete_import_job(p_job_id uuid)
returns void language sql as $$
  update import_jobs
  set status = 'completed',
      updated_at = now()
  where id = p_job_id;
$$;

-- Function untuk mark job failed
create or replace function public.fail_import_job(p_job_id uuid, p_error text)
returns void language sql as $$
  update import_jobs
  set status = 'failed',
      result = jsonb_set(result, '{error}', to_jsonb(p_error)),
      updated_at = now()
  where id = p_job_id;
$$;

-- Function untuk mark job running
create or replace function public.start_import_job(p_job_id uuid)
returns void language sql as $$
  update import_jobs
  set status = 'running',
      updated_at = now()
  where id = p_job_id;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table import_jobs enable row level security;

drop policy if exists import_jobs_select on import_jobs;
create policy import_jobs_select on import_jobs for select
  using (auth.uid() = user_id or public.current_peran() = 'superadmin');

drop policy if exists import_jobs_insert on import_jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists import_jobs_update on import_jobs for update
  using (auth.uid() = user_id or public.current_peran() = 'superadmin')
  with check (auth.uid() = user_id or public.current_peran() = 'superadmin');