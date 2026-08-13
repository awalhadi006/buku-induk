export async function load({ locals }) {
	const [{ data: santriData }, { data: kamarData }, { data: kelasData }] = await Promise.all([
		locals.supabase
			.from('santri')
			.select('id,nama_lengkap,nisn,jenis_kelamin,status_santri,status_keluarga,kamar_id,kelas_id,kamar(nomor),kelas(tingkap,rombel)')
			.order('nama_lengkap'),
		locals.supabase.from('kamar').select('id,nomor').eq('aktif', true).order('nomor'),
		locals.supabase.from('kelas').select('id,tingkap,rombel').eq('aktif', true).order('tingkap').order('rombel')
	]);

	const santri = (santriData ?? []).map((s: any) => ({
		id: s.id,
		nama_lengkap: s.nama_lengkap,
		nisn: s.nisn,
		jenis_kelamin: s.jenis_kelamin,
		status_santri: s.status_santri,
		status_keluarga: s.status_keluarga,
		kamar_id: s.kamar_id,
		kelas_id: s.kelas_id,
		kamar: Array.isArray(s.kamar) ? (s.kamar[0] ?? null) : (s.kamar ?? null),
		kelas: Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null)
	}));

	return {
		santri,
		kamar: kamarData ?? [],
		kelas: kelasData ?? []
	};
}
