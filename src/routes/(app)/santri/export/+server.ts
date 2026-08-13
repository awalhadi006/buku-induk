import { redirect } from '@sveltejs/kit';

export async function GET({ locals }) {
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

	for (const s of data ?? []) {
		const kamar = Array.isArray(s.kamar) ? (s.kamar[0]?.nomor ?? '') : (s.kamar?.nomor ?? '');
		const kelas = Array.isArray(s.kelas) ? (s.kelas[0] ? `${s.kelas[0].tingkat} ${s.kelas[0].rombel}` : '') : (s.kelas ? `${s.kelas.tingkat} ${s.kelas.rombel}` : '');
		const wali = Array.isArray(s.wali_santri) ? (s.wali_santri[0] ?? {}) : (s.wali_santri ?? {});
		const waliLabel = (wali.nama_wali || wali.nama_ayah || wali.nama_ibu || '').replace(/,/g, ' ');

		const row = [
			s.nama_lengkap, s.nisn, s.nik, s.nis, s.nipd, s.nama_panggilan, s.tempat_lahir, s.tanggal_lahir,
			s.jenis_kelamin, s.agama, s.kewarganegaraan, s.tempat_tinggal, s.transportasi, s.anak_ke, s.no_hp,
			(s.alamat || '').replace(/,/g, ' '), s.rt, s.rw, s.desa, s.kecamatan, s.kabupaten, s.no_akta, s.no_kk,
			s.bantuan_kip, s.status_keluarga, s.status_santri, s.tanggal_masuk, s.asal_sekolah, s.jalur_masuk,
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
