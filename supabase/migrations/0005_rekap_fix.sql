-- 0005_rekap_fix: perbaikan fungsi fn_rekap agar aman dari error NULL pada kolom kabupaten/status (fix: "field name must not be null").
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

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
    'per_status', coalesce((select jsonb_object_agg(t.status_santri, t.n) from (
        select coalesce(status_santri, 'aktif') as status_santri, count(*) as n 
        from public.santri s where (peran in ('superadmin','admin_tu') or (peran = 'wali_kamar' and s.kamar_id = kamar_sc) or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)) 
        group by 1
    ) t), '{}'::jsonb),
    'per_gender', coalesce((select jsonb_object_agg(t.jenis_kelamin, t.n) from (
        select coalesce(jenis_kelamin, '-') as jenis_kelamin, count(*) as n 
        from public.santri s where (peran in ('superadmin','admin_tu') or (peran = 'wali_kamar' and s.kamar_id = kamar_sc) or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)) 
        group by 1
    ) t), '{}'::jsonb),
    'per_daerah', coalesce((select jsonb_object_agg(t.kabupaten, t.n) from (
        select coalesce(kabupaten, '-') as kabupaten, count(*) as n 
        from public.santri s where (peran in ('superadmin','admin_tu') or (peran = 'wali_kamar' and s.kamar_id = kamar_sc) or (peran = 'wali_kelas' and s.kelas_id = kelas_sc)) 
        group by 1
    ) t), '{}'::jsonb)
  )
  into r;

  -- Tambahkan per_kamar dan per_kelas
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
      where k.nomor is not null
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
      where ke.tingkat is not null
    ), '[]'::jsonb)
  );

  return r;
end
$$;
