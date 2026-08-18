import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	if (!ADMIN_ROLES.includes(profile?.peran ?? '')) throw redirect(303, '/');

	const tahunFilter = url.searchParams.get('tahun') ?? '';
	const kelasFilter = url.searchParams.get('kelas') ?? '';

	const [{ data: santri }, { data: history }] = await Promise.all([
		supabase
			.from('santri')
			.select('id,nama_lengkap,nisn,nik,nipd,jenis_kelamin,status_keluarga,kabupaten,kelas(tingkat,rombel,tahun_ajaran)')
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

	let alumni = (santri ?? []).map((s) => {
		const kelas = Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null);
		const kelasLabel = kelas
			? `${kelas.tingkat} ${kelas.rombel}${kelas.tahun_ajaran && kelas.tahun_ajaran !== '—' ? ` (${kelas.tahun_ajaran})` : ''}`
			: '';
		const tgl = tanggalLulus[s.id] ?? '';
		return {
			nama_lengkap: s.nama_lengkap ?? '',
			nisn: s.nisn ?? '',
			nik: s.nik ?? '',
			nipd: s.nipd ?? '',
			jenis_kelamin: s.jenis_kelamin === 'L' ? 'Laki-laki' : s.jenis_kelamin === 'P' ? 'Perempuan' : '',
			kelas: kelasLabel,
			status_keluarga: s.status_keluarga ?? '',
			kabupaten: s.kabupaten ?? '',
			tanggal_lulus: tgl
		};
	});

	if (tahunFilter) {
		alumni = alumni.filter((a) => a.tanggal_lulus.slice(0, 4) === tahunFilter);
	}
	if (kelasFilter) {
		alumni = alumni.filter((a) => a.kelas === kelasFilter);
	}

	const headers = ['Nama Lengkap', 'NISN', 'NIK', 'NIPD', 'Jenis Kelamin', 'Kelas Terakhir', 'Status Keluarga', 'Kabupaten', 'Tanggal Lulus'];
	const rows = alumni.map((a) => [
		a.nama_lengkap,
		a.nisn,
		a.nik,
		a.nipd,
		a.jenis_kelamin,
		a.kelas,
		a.status_keluarga,
		a.kabupaten,
		a.tanggal_lulus
	]);

	const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Alumni');
	const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

	const dateStr = new Date().toISOString().slice(0, 10);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="alumni-${dateStr}.xlsx"`
		}
	});
};
