-- 0007_rekap_tahun_ajaran: memperbarui fn_rekap agar dapat memfilter berdasarkan tahun_ajaran_aktif yang diset di tabel settings, dicocokkan dengan kelas.tahun_ajaran.
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

create or replace function public.fn_rekap()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  peran text := public.current_peran();
  kamar_sc bigint := public.current_kamar_id();
  kelas_sc bigint := public.current_kelas_id();
  ta_aktif text;
  r jsonb;
begin
  if not public.has_permission('dashboard') then
    return null;
  end if;

  select value into ta_aktif from public.settings where key = 'tahun_ajaran_aktif';

  select jsonb_build_object(
    'total', (select count(*) from public.santri s
      left join public.kelas ke on ke.id = s.kelas_id
      where ((peran in ('superadmin','admin_tu'))
         or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
         or (peran = 'wali_kelas' and s.kelas_id = kelas_sc))
        and (ta_aktif is null or ta_aktif = '' or ke.tahun_ajaran = ta_aktif or ke.tahun_ajaran = '—')),
    'per_status', coalesce((select jsonb_object_agg(t.status_santri, t.n) from (
        select coalesce(s.status_santri, 'aktif') as status_santri, count(*) as n 
        from public.santri s 
        left join public.kelas ke on ke.id = s.kelas_id
        where ((peran in ('superadmin','admin_tu') or (peran = 'wali_kamar' and s.kamar_id = kamar_sc) or (peran = 'wali_kelas' and s.kelas_id = kelas_sc))
          and (ta_aktif is null or ta_aktif = '' or ke.tahun_ajaran = ta_aktif or ke.tahun_ajaran = '—'))
        group by 1
    ) t), '{}'::jsonb),
    'per_gender', coalesce((select jsonb_object_agg(t.jenis_kelamin, t.n) from (
        select coalesce(s.jenis_kelamin, '-') as jenis_kelamin, count(*) as n 
        from public.santri s 
        left join public.kelas ke on ke.id = s.kelas_id
        where ((peran in ('superadmin','admin_tu') or (peran = 'wali_kamar' and s.kamar_id = kamar_sc) or (peran = 'wali_kelas' and s.kelas_id = kelas_sc))
          and (ta_aktif is null or ta_aktif = '' or ke.tahun_ajaran = ta_aktif or ke.tahun_ajaran = '—'))
        group by 1
    ) t), '{}'::jsonb),
    'per_daerah', coalesce((select jsonb_object_agg(t.kabupaten, t.n) from (
        select coalesce(s.kabupaten, '-') as kabupaten, count(*) as n 
        from public.santri s 
        left join public.kelas ke on ke.id = s.kelas_id
        where ((peran in ('superadmin','admin_tu') or (peran = 'wali_kamar' and s.kamar_id = kamar_sc) or (peran = 'wali_kelas' and s.kelas_id = kelas_sc))
          and (ta_aktif is null or ta_aktif = '' or ke.tahun_ajaran = ta_aktif or ke.tahun_ajaran = '—'))
        group by 1
    ) t), '{}'::jsonb)
  )
  into r;

  r := r || jsonb_build_object(
    'per_kamar', coalesce((
      select jsonb_agg(jsonb_build_object('nomor', k.nomor, 'jumlah', t.n) order by k.nomor)
      from (
        select s.kamar_id, count(*) as n
        from public.santri s
        left join public.kelas ke on ke.id = s.kelas_id
        where ((peran in ('superadmin','admin_tu'))
           or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
           or (peran = 'wali_kelas' and s.kelas_id = kelas_sc))
          and (ta_aktif is null or ta_aktif = '' or ke.tahun_ajaran = ta_aktif or ke.tahun_ajaran = '—')
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
        left join public.kelas ke on ke.id = s.kelas_id
        where ((peran in ('superadmin','admin_tu'))
           or (peran = 'wali_kamar' and s.kamar_id = kamar_sc)
           or (peran = 'wali_kelas' and s.kelas_id = kelas_sc))
          and (ta_aktif is null or ta_aktif = '' or ke.tahun_ajaran = ta_aktif or ke.tahun_ajaran = '—')
        group by s.kelas_id
      ) t
      left join public.kelas ke on ke.id = t.kelas_id
      where ke.tingkat is not null
    ), '[]'::jsonb)
  );

  return r;
end
$$;
