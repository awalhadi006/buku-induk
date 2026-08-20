import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import * as XLSX from 'xlsx';
import { EXPORT_FIELDS } from '$lib/export-fields';

const SELECT =
	'nama_lengkap,nisn,nik,nis,nama_panggilan,tempat_lahir,tanggal_lahir,jenis_kelamin,agama,kewarganegaraan,tempat_tinggal,transportasi,anak_ke,no_hp,alamat,rt,rw,desa,kecamatan,kabupaten,no_akta,no_kk,bantuan_kip,status_keluarga,status_santri,tanggal_masuk,asal_sekolah,jalur_masuk,kamar(nomor),kelas(tingkat,rombel),wali_santri(nama_ayah,nama_ibu,nama_wali,pekerjaan_ayah,pekerjaan_ibu,penghasilan,alamat,no_hp)';

const ACCESSORS: Record<string, (s: any, k: any, cl: any, w: any) => string> = {
	nama_lengkap: (s) => s.nama_lengkap ?? '',
	nisn: (s) => s.nisn ?? '',
	nik: (s) => s.nik ?? '',
	nis: (s) => s.nis ?? '',
	nama_panggilan: (s) => s.nama_panggilan ?? '',
	tempat_lahir: (s) => s.tempat_lahir ?? '',
	tanggal_lahir: (s) => s.tanggal_lahir ?? '',
	jenis_kelamin: (s) => s.jenis_kelamin ?? '',
	agama: (s) => s.agama ?? '',
	kewarganegaraan: (s) => s.kewarganegaraan ?? '',
	tempat_tinggal: (s) => s.tempat_tinggal ?? '',
	transportasi: (s) => s.transportasi ?? '',
	anak_ke: (s) => (s.anak_ke ?? '').toString(),
	no_hp: (s) => s.no_hp ?? '',
	alamat: (s) => s.alamat ?? '',
	rt: (s) => s.rt ?? '',
	rw: (s) => s.rw ?? '',
	desa: (s) => s.desa ?? '',
	kecamatan: (s) => s.kecamatan ?? '',
	kabupaten: (s) => s.kabupaten ?? '',
	no_akta: (s) => s.no_akta ?? '',
	no_kk: (s) => s.no_kk ?? '',
	bantuan_kip: (s) => s.bantuan_kip ?? '',
	status_keluarga: (s) => s.status_keluarga ?? '',
	status_santri: (s) => s.status_santri ?? '',
	tanggal_masuk: (s) => s.tanggal_masuk ?? '',
	asal_sekolah: (s) => s.asal_sekolah ?? '',
	jalur_masuk: (s) => s.jalur_masuk ?? '',
	kamar: (s, k) => k.nomor ?? '',
	kelas: (s, k, cl) => (cl.tingkat ? `${cl.tingkat}${cl.rombel}` : ''),
	nama_ayah: (s, k, cl, w) => w.nama_ayah ?? '',
	nama_ibu: (s, k, cl, w) => w.nama_ibu ?? '',
	nama_wali: (s, k, cl, w) => w.nama_wali ?? '',
	pekerjaan_ayah: (s, k, cl, w) => w.pekerjaan_ayah ?? '',
	pekerjaan_ibu: (s, k, cl, w) => w.pekerjaan_ibu ?? '',
	penghasilan: (s, k, cl, w) => w.penghasilan ?? '',
	alamat_wali: (s, k, cl, w) => w.alamat ?? '',
	no_hp_wali: (s, k, cl, w) => w.no_hp ?? ''
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const format = (url.searchParams.get('format') ?? 'xlsx').toLowerCase();
	const fieldsParam = url.searchParams.get('fields');
	const selectedKeys = fieldsParam
		? fieldsParam.split(',').filter(Boolean)
		: EXPORT_FIELDS.map((f) => f.key);
	const selected = EXPORT_FIELDS.filter((f) => selectedKeys.includes(f.key));

	const { data, error: qErr } = await supabase
		.from('santri')
		.select(SELECT)
		.order('nama_lengkap');
	if (qErr) return new Response(`DB Error: ${qErr.message}`, { status: 500 });

	const rows = (data ?? []).map((s: any) => {
		const k = Array.isArray(s.kamar) ? (s.kamar[0] ?? {}) : (s.kamar ?? {});
		const cl = Array.isArray(s.kelas) ? (s.kelas[0] ?? {}) : (s.kelas ?? {});
		const w = Array.isArray(s.wali_santri) ? (s.wali_santri[0] ?? {}) : (s.wali_santri ?? {});
		return selected.map((f) => ACCESSORS[f.key](s, k, cl, w));
	});

	const date = new Date().toISOString().slice(0, 10);

	if (format === 'csv') {
		const ws = XLSX.utils.aoa_to_sheet([selected.map((f) => f.label), ...rows]);
		const csv = XLSX.utils.sheet_to_csv(ws);
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="santri-${date}.csv"`
			}
		});
	}

	if (selectedKeys.length === EXPORT_FIELDS.length) {
		const templateUrl = new URL('/live-template.xlsx', url.origin);
		const templateRes = await fetch(templateUrl.href);
		if (templateRes.ok) {
			const templateBuf = await templateRes.arrayBuffer();
			const wb = XLSX.read(new Uint8Array(templateBuf), { type: 'array' });
			const ws = wb.Sheets[wb.SheetNames[0]];
			XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A2' });
			const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
			return new Response(buffer, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'Content-Disposition': `attachment; filename="santri-${date}.xlsx"`
				}
			});
		}
	}

	const ws = XLSX.utils.aoa_to_sheet([selected.map((f) => f.label), ...rows]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Santri');
	const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="santri-${date}.xlsx"`
		}
	});
};
