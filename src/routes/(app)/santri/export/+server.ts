import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data, error: qErr } = await supabase
		.from('santri')
		.select('nisn,nik,nis,nipd,nama_lengkap,nama_panggilan,tempat_lahir,tanggal_lahir,jenis_kelamin,agama,kewarganegaraan,tempat_tinggal,transportasi,anak_ke,no_hp,alamat,rt,rw,desa,kecamatan,kabupaten,no_akta,no_kk,bantuan_kip,status_keluarga,status_santri,tanggal_masuk,asal_sekolah,jalur_masuk,kamar(nomor),kelas(tingkat,rombel),wali_santri(nama_ayah,nama_ibu,nama_wali)')
		.order('nama_lengkap');

	if (qErr) {
		return new Response(`DB Error: ${qErr.message}`, { status: 500 });
	}

	const headers = [
		'Nama Lengkap', 'NISN', 'NIK', 'NIS', 'NIPD', 'Nama Panggilan', 'Tempat Lahir', 'Tanggal Lahir',
		'JK', 'Agama', 'Kewarganegaraan', 'Tempat Tinggal', 'Transportasi', 'Anak Ke', 'HP', 'Alamat',
		'RT', 'RW', 'Desa', 'Kecamatan', 'Kabupaten', 'Akta', 'KK', 'Bantuan', 'Status Keluarga',
		'Status Santri', 'Tgl Masuk', 'Asal Sekolah', 'Jalur Masuk', 'Kamar', 'Kelas', 'Wali'
	];
	const csvRows = [headers.join(',')];

	for (const santri of data ?? []) {
		const kamar = Array.isArray(santri.kamar) ? (santri.kamar[0]?.nomor ?? '') : (santri.kamar?.nomor ?? '');
		const kelas = Array.isArray(santri.kelas) ? (santri.kelas[0] ? `${santri.kelas[0].tingkat} ${santri.kelas[0].rombel}` : '') : (santri.kelas ? `${santri.kelas.tingkat} ${santri.kelas.rombel}` : '');
		const wali = Array.isArray(santri.wali_santri) ? (santri.wali_santri[0] ?? {}) : (santri.wali_santri ?? {});
		const waliLabel = (wali.nama_wali || wali.nama_ayah || wali.nama_ibu || '').replace(/,/g, ' ');

		const row = [
			santri.nama_lengkap, santri.nisn, santri.nik, santri.nis, santri.nipd, santri.nama_panggilan, santri.tempat_lahir, santri.tanggal_lahir,
			santri.jenis_kelamin, santri.agama, santri.kewarganegaraan, santri.tempat_tinggal, santri.transportasi, santri.anak_ke, santri.no_hp,
			(santri.alamat || '').replace(/,/g, ' '), santri.rt, santri.rw, santri.desa, santri.kecamatan, santri.kabupaten, santri.no_akta, santri.no_kk,
			santri.bantuan_kip, santri.status_keluarga, santri.status_santri, santri.tanggal_masuk, santri.asal_sekolah, santri.jalur_masuk,
			kamar, kelas, waliLabel
		];
		csvRows.push(row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
	}

	const date = new Date().toISOString().slice(0, 10);
	return new Response(csvRows.join('\n'), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="santri-${date}.csv"`
		}
	});
}
