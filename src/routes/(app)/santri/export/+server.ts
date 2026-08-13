import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { buildExportBuffer } from '$lib/excel';

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

	const rows = (data ?? []).map((s: any) => {
		const kamar = Array.isArray(s.kamar) ? (s.kamar[0] ?? null) : (s.kamar ?? null);
		const kelas = Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null);
		const wali = Array.isArray(s.wali_santri) ? (s.wali_santri[0] ?? null) : (s.wali_santri ?? null);
		const waliLabel = wali ? wali.nama_wali || wali.nama_ayah || wali.nama_ibu || '' : '';
		return {
			nama_lengkap: s.nama_lengkap ?? '',
			nisn: s.nisn ?? '',
			nik: s.nik ?? '',
			nis: s.nis ?? '',
			nipd: s.nipd ?? '',
			nama_panggilan: s.nama_panggilan ?? '',
			tempat_lahir: s.tempat_lahir ?? '',
			tanggal_lahir: s.tanggal_lahir ?? '',
			jenis_kelamin: s.jenis_kelamin ?? '',
			agama: s.agama ?? '',
			kewarganegaraan: s.kewarganegaraan ?? '',
			tempat_tinggal: s.tempat_tinggal ?? '',
			transportasi: s.transportasi ?? '',
			anak_ke: s.anak_ke ?? '',
			no_hp: s.no_hp ?? '',
			alamat: s.alamat ?? '',
			rt: s.rt ?? '',
			rw: s.rw ?? '',
			desa: s.desa ?? '',
			kecamatan: s.kecamatan ?? '',
			kabupaten: s.kabupaten ?? '',
			no_akta: s.no_akta ?? '',
			no_kk: s.no_kk ?? '',
			bantuan_kip: s.bantuan_kip ?? '',
			status_keluarga: s.status_keluarga ?? '',
			status_santri: s.status_santri ?? '',
			tanggal_masuk: s.tanggal_masuk ?? '',
			asal_sekolah: s.asal_sekolah ?? '',
			jalur_masuk: s.jalur_masuk ?? '',
			kamar: kamar ? `Kamar ${kamar.nomor}` : '',
			kelas: kelas ? `${kelas.tingkat} ${kelas.rombel}` : '',
			wali: waliLabel
		};
	});

	const buffer = buildExportBuffer(rows);
	const date = new Date().toISOString().slice(0, 10);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="santri-${date}.xlsx"`
		}
	});
};
