-- 0002_rekap: RPC rekapitulasi agregat untuk dashboard (ADR-0004).
-- Amat: agregat dibolehkan untuk peran dengan ability 'dashboard', tapi DETIL santri
-- tetap tertutup RLS. Wali Kamar/Kelas hanya dihitung dari scope masing-masing.

create or replace function public.fn_rekap()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  peran text := public.current_peran();
  kamar_sc bigint := public.current_kamar_id();
  kelas_sc bigint := public.current_kelas_id();
  r jsonb;
begin
  if not public.has_permission('dashboard') then
    return null;
  end if;

  select jsonb_build_object(
    'total', (select count(*) from public.santri s
      where (peran in ('superadmin','admin_tu'))
         or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
         or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)),
    'per_status', coalesce(jsonb_object_agg(t.status_santri, t.n), '{}'::jsonb),
    'per_gender', coalesce(jsonb_object_agg(t.jenis_kelamin, t.n), '{}'::jsonb),
    'per_daerah', coalesce(jsonb_object_agg(coalesce(t.kabupaten, '-'), t.n), '{}'::jsonb)
  )
  into r
  from (
    select s.status_santri, s.jenis_kelamin, s.kabupaten, count(*) as n
    from public.santri s
    where (peran in ('superadmin','admin_tu'))
       or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
       or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)
    group by s.status_santri, s.jenis_kelamin, s.kabupaten
  ) t;

  r := r || jsonb_build_object(
    'per_kamar', coalesce((
      select jsonb_agg(jsonb_build_object('nomor', k.nomor, 'jumlah', t.n) order by k.nomor)
      from (
        select s.kamar_id, count(*) as n
        from public.santri s
        where (peran in ('superadmin','admin_tu'))
           or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
           or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)
        group by s.kamar_id
      ) t
      left join public.kamar k on k.id = t.kamar_id
    ), '[]'::jsonb),
    'per_kelas', coalesce((
      select jsonb_agg(jsonb_build_object('kelas', concat(ke.tingkat, ' ', ke.rombel), 'jumlah', t.n) order by ke.tingkat, ke.rombel)
      from (
        select s.kelas_id, count(*) as n
        from public.santri s
        where (peran in ('superadmin','admin_tu'))
           or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
           or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)
        group by s.kelas_id
      ) t
      left join public.kelas ke on ke.id = t.kelas_id
    ), '[]'::jsonb)
  );

  return r;
end
$$;

revoke execute on function public.fn_rekap() from public;
grant execute on function public.fn_rekap() to authenticated;

-- Fungsi untuk mengambil daftar kabupaten unik (filter asal daerah)
create or replace function public.fn_unique_kabupaten()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r jsonb;
begin
  select jsonb_agg(distinct s.kabupaten order by s.kabupaten)
  into r
  from public.santri s
  where s.kabupaten is not null and s.kabupaten <> '';

  return coalesce(r, '[]'::jsonb);
end
$$;

revoke execute on function public.fn_unique_kabupaten() from public;
grant execute on function public.fn_unique_kabupaten() to authenticated;
