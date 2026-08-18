-- Support custom effective date in status_history trigger
-- Falls back to current_date when session variable is not set

create or replace function public.log_status_history()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  effective_date date := current_date;
  cfg text;
begin
  begin
    cfg := current_setting('app.tanggal_efektif', true);
    if cfg is not null and cfg <> '' then
      effective_date := cfg::date;
    end if;
  exception when others then
    effective_date := current_date;
  end;

  if old.kamar_id is distinct from new.kamar_id then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, tanggal_efektif, created_by)
    values (new.id, 'kamar', old.kamar_id::text, new.kamar_id::text, effective_date, auth.uid());
  end if;
  if old.kelas_id is distinct from new.kelas_id then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, tanggal_efektif, created_by)
    values (new.id, 'kelas', old.kelas_id::text, new.kelas_id::text, effective_date, auth.uid());
  end if;
  if old.status_santri is distinct from new.status_santri then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, tanggal_efektif, created_by)
    values (new.id, 'status_santri', old.status_santri, new.status_santri, effective_date, auth.uid());
  end if;
  if old.status_keluarga is distinct from new.status_keluarga then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, tanggal_efektif, created_by)
    values (new.id, 'status_keluarga', old.status_keluarga, new.status_keluarga, effective_date, auth.uid());
  end if;
  if old.wali_santri_id is distinct from new.wali_santri_id then
    insert into public.status_history (santri_id, jenis, nilai_lama, nilai_baru, tanggal_efektif, created_by)
    values (new.id, 'wali', old.wali_santri_id::text, new.wali_santri_id::text, effective_date, auth.uid());
  end if;
  return new;
end
$$;

-- RPC: bulk naik kelas with custom effective date
create or replace function public.bulk_naik_kelas(
  p_source_kelas_id int,
  p_target_kelas_id int,
  p_tanggal_efektif date default current_date
)
returns int language plpgsql security definer set search_path = public as $$
declare
  affected int;
begin
  perform set_config('app.tanggal_efektif', p_tanggal_efektif::text, true);

  update santri
  set kelas_id = p_target_kelas_id
  where kelas_id = p_source_kelas_id
    and status_santri in ('aktif', 'khusus');

  get diagnostics affected = row_count;
  return affected;
end
$$;

-- RPC: bulk lulus massal with custom effective date
create or replace function public.bulk_lulus_massal(
  p_kelas_id int,
  p_tanggal_efektif date default current_date
)
returns int language plpgsql security definer set search_path = public as $$
declare
  affected int;
begin
  perform set_config('app.tanggal_efektif', p_tanggal_efektif::text, true);

  update santri
  set status_santri = 'lulus'
  where kelas_id = p_kelas_id
    and status_santri in ('aktif', 'khusus');

  get diagnostics affected = row_count;
  return affected;
end
$$;
