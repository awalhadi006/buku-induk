export async function load({ locals }) {
	const [{ data: santriData }, { data: kamarData }, { data: kelasData }, { data: kabupatenData }] = await Promise.all([
		locals.supabase
			.from('santri')
			.select('id,nama_lengkap,nisn,nik,nis,nipd,jenis_kelamin,status_santri,status_keluarga,kamar_id,kelas_id,kabupaten,kamar(nomor),kelas(tingkat,rombel)')
			.order('nama_lengkap'),
		locals.supabase.from('kamar').select('id,nomor').eq('aktif', true).order('nomor'),
		locals.supabase.from('kelas').select('id,tingkat,rombel').eq('aktif', true).order('tingkat').order('rombel'),
		locals.supabase.rpc('fn_unique_kabupaten')
	]);

	const santri = (santriData ?? []).map((s: any) => ({
		id: s.id,
		nama_lengkap: s.nama_lengkap,
		nisn: s.nisn,
		nik: s.nik,
		nis: s.nis,
		nipd: s.nipd,
		jenis_kelamin: s.jenis_kelamin,
		status_santri: s.status_santri,
		status_keluarga: s.status_keluarga,
		kamar_id: s.kamar_id,
		kelas_id: s.kelas_id,
		kabupaten: s.kabupaten,
		kamar: Array.isArray(s.kamar) ? (s.kamar[0] ?? null) : (s.kamar ?? null),
		kelas: Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null)
	}));

	return {
		santri,
		kamar: kamarData ?? [],
		kelas: kelasData ?? [],
		kabupaten: (kabupatenData ?? []) as string[]
	};
}
