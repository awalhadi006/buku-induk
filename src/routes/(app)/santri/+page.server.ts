const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function load({ locals, url }) {
	const page = Number(url.searchParams.get('page')) || 1;
	const pageSize = Math.min(
		Number(url.searchParams.get('limit')) || DEFAULT_PAGE_SIZE,
		MAX_PAGE_SIZE
	);
	const search = url.searchParams.get('q')?.trim() || '';
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	let santriQuery = locals.supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,nik,nis,jenis_kelamin,status_santri,status_keluarga,kamar_id,kelas_id,kabupaten,tempat_lahir,tanggal_lahir,wali_santri_id,kamar(nomor),kelas(tingkat,rombel)', { count: 'exact' })
		.order('nama_lengkap')
		.range(from, to);

	if (search) {
		const pattern = `%${search.toLowerCase()}%`;
		santriQuery = santriQuery.or(
			`nama_lengkap.ilike.${pattern},nisn.ilike.${pattern},nik.ilike.${pattern},nis.ilike.${pattern}`
		);
	}

	const [{ data: santriData, count }, { data: kamarData }, { data: kelasData }, { data: kabupatenData }] = await Promise.all([
		santriQuery,
		locals.supabase.from('kamar').select('id,nomor').eq('aktif', true).order('nomor'),
		locals.supabase.from('kelas').select('id,tingkat,rombel').eq('aktif', true).order('tingkat').order('rombel'),
		locals.supabase.rpc('fn_unique_kabupaten')
	]);

	const total = count ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	const santri = (santriData ?? []).map((s: any) => ({
		id: s.id,
		nama_lengkap: s.nama_lengkap,
		nisn: s.nisn,
		nik: s.nik,
		nis: s.nis,
		jenis_kelamin: s.jenis_kelamin,
		status_santri: s.status_santri,
		status_keluarga: s.status_keluarga,
		kamar_id: s.kamar_id,
		kelas_id: s.kelas_id,
		kabupaten: s.kabupaten,
		tempat_lahir: s.tempat_lahir,
		tanggal_lahir: s.tanggal_lahir,
		wali_santri_id: s.wali_santri_id,
		kamar: Array.isArray(s.kamar) ? (s.kamar[0] ?? null) : (s.kamar ?? null),
		kelas: Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null)
	}));

	return {
		santri,
		kamar: kamarData ?? [],
		kelas: kelasData ?? [],
		kabupaten: (kabupatenData ?? []) as string[],
		pagination: {
			page,
			pageSize,
			total,
			totalPages,
			pageSizeOptions: PAGE_SIZE_OPTIONS
		},
		search
	};
}
