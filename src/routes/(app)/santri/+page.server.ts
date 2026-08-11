export async function load({ locals }) {
	const { data } = await locals.supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,jenis_kelamin,status_santri,kamar(nomor),kelas(tingkat,rombel)')
		.order('nama_lengkap')
		.limit(100);

	const santri = (data ?? []).map((s: any) => ({
		id: s.id,
		nama_lengkap: s.nama_lengkap,
		nisn: s.nisn,
		jenis_kelamin: s.jenis_kelamin,
		status_santri: s.status_santri,
		kamar: Array.isArray(s.kamar) ? (s.kamar[0] ?? null) : (s.kamar ?? null),
		kelas: Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null)
	}));

	return { santri };
}