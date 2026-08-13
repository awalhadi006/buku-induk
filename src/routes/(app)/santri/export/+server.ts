import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { IMPORT_HEADERS } from '$lib/excel';
import * as XLSX from 'xlsx';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	// 1. Ambil template yang sudah ada warnanya (dari folder static)
	const templateUrl = new URL('/template-import-santri.xlsx', url.origin);
	const templateRes = await fetch(templateUrl.href);
	if (!templateRes.ok) return new Response('Template not found', { status: 500 });
	const templateBuf = await templateRes.arrayBuffer();

	// 2. Baca workbook template
	const wb = XLSX.read(new Uint8Array(templateBuf), { type: 'array' });
	const ws = wb.Sheets[wb.SheetNames[0]];

	// 3. Ambil data santri
	const { data, error: qErr } = await supabase
		.from('santri')
		.select(
			'nama_lengkap,nisn,nik,nis,nipd,nama_panggilan,tempat_lahir,tanggal_lahir,jenis_kelamin,agama,kewarganegaraan,tempat_tinggal,transportasi,anak_ke,no_hp,alamat,rt,rw,desa,kecamatan,kabupaten,no_akta,no_kk,bantuan_kip,status_keluarga,status_santri,tanggal_masuk,asal_sekolah,jalur_masuk,kamar(nomor),kelas(tingkat,rombel),wali_santri(nama_ayah,nama_ibu,nama_wali,pekerjaan_ayah,pekerjaan_ibu,penghasilan,alamat,no_hp)'
		)
		.order('nama_lengkap');

	if (qErr) return new Response(`DB Error: ${qErr.message}`, { status: 500 });

	// 4. Susun data (tanpa header, karena header sudah ada di template)
	const rows = (data ?? []).map((s: any) => {
		const k = Array.isArray(s.kamar) ? (s.kamar[0] ?? {}) : (s.kamar ?? {});
		const cl = Array.isArray(s.kelas) ? (s.kelas[0] ?? {}) : (s.kelas ?? {});
		const w = Array.isArray(s.wali_santri) ? (s.wali_santri[0] ?? {}) : (s.wali_santri ?? {});

		return [
			s.nama_lengkap ?? '', s.nisn ?? '', s.nik ?? '', s.nis ?? '', s.nipd ?? '',
			s.nama_panggilan ?? '', s.tempat_lahir ?? '', s.tanggal_lahir ?? '', s.jenis_kelamin ?? '',
			s.agama ?? '', s.kewarganegaraan ?? '', s.tempat_tinggal ?? '', s.transportasi ?? '',
			s.anak_ke ?? '', s.no_hp ?? '', s.alamat ?? '', s.rt ?? '', s.rw ?? '', s.desa ?? '',
			s.kecamatan ?? '', s.kabupaten ?? '', s.no_akta ?? '', s.no_kk ?? '', s.bantuan_kip ?? '',
			s.status_keluarga ?? '', s.status_santri ?? '', s.tanggal_masuk ?? '', s.asal_sekolah ?? '',
			s.jalur_masuk ?? '', k.nomor ?? '', cl.tingkat ? `${cl.tingkat}${cl.rombel}` : '',
			w.nama_ayah ?? '', w.nama_ibu ?? '', w.nama_wali ?? '', w.pekerjaan_ayah ?? '',
			w.pekerjaan_ibu ?? '', w.penghasilan ?? '', w.alamat ?? '', w.no_hp ?? ''
		];
	});

	// 5. Timpa/tambahkan data mulai dari baris ke-2 (A2)
	XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A2' });

	const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	const date = new Date().toISOString().slice(0, 10);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="santri-${date}.xlsx"`
		}
	});
};
