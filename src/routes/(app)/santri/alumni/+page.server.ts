import { redirect } from '@sveltejs/kit';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	if (!ADMIN_ROLES.includes(profile?.peran ?? '')) throw redirect(303, '/');

	const [{ data: santri }, { data: history }] = await Promise.all([
		supabase
			.from('santri')
			.select('id,nama_lengkap,nisn,nik,jenis_kelamin,status_keluarga,kabupaten,kelas(tingkat,rombel,tahun_ajaran)')
			.eq('status_santri', 'lulus')
			.order('nama_lengkap'),
		supabase
			.from('status_history')
			.select('santri_id,tanggal_efektif')
			.eq('jenis', 'status_santri')
			.eq('nilai_baru', 'lulus')
	]);

	const tanggalLulus: Record<string, string> = {};
	for (const h of history ?? []) {
		tanggalLulus[h.santri_id] = h.tanggal_efektif ?? '';
	}

	const alumni = (santri ?? []).map((s) => {
		const kelas = Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null);
		return {
			id: s.id,
			nama_lengkap: s.nama_lengkap,
			nisn: s.nisn,
			nik: s.nik,
			jenis_kelamin: s.jenis_kelamin,
			status_keluarga: s.status_keluarga,
			kabupaten: s.kabupaten,
			tanggal_lulus: tanggalLulus[s.id] ?? '',
			kelas: kelas ? `${kelas.tingkat} ${kelas.rombel}${kelas.tahun_ajaran && kelas.tahun_ajaran !== '—' ? ` (${kelas.tahun_ajaran})` : ''}` : ''
		};
	});

	const tahunOptions = Array.from(
		new Set(alumni.map((a) => a.tanggal_lulus.slice(0, 4)).filter(Boolean))
	).sort((a, b) => b.localeCompare(a));

	return { alumni, tahunOptions };
}
