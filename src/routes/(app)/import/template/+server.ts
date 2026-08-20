import { IMPORT_COLUMNS } from '$lib/excel';
import { isAdmin } from '$lib/permissions';
import * as XLSX from 'xlsx';

export async function GET({ locals }) {
	if (!(await isAdmin(locals))) return new Response('Forbidden', { status: 403 });

	const ws = XLSX.utils.aoa_to_sheet([IMPORT_COLUMNS.map((c) => c.header)]);
	const guide = XLSX.utils.aoa_to_sheet([
		['Panduan import data santri'],
		[''],
		['1. Isi sheet "santri". Baris pertama adalah header — jangan diubah. Data mulai baris 2.'],
		['2. Kolom "Nama lengkap" wajib diisi; kolom lain opsional.'],
		['3. Jenis kelamin: L atau P'],
		['4. Status santri: aktif, khusus, mutasi_keluar, lulus, wafat, drop_out'],
		['5. Status keluarga: yatim, yatim_piatu, dhuafa, umum'],
		['6. Kamar: nomor kamar (contoh: 3). Kelas: tingkat+rombel (contoh: 7A).'],
		['7. Isi nama ayah/ibu/wali agar wali santri ikut tercatat.'],
		[''],
		['Contoh:'],
		['Nama lengkap', 'NISN', 'Jenis kelamin (L/P)', 'Status santri', 'Kamar (nomor)', 'Kelas (mis. 7A)', 'Nama ayah'],
		['Ahmad Fauzi', '0012345678', 'L', 'aktif', '3', '7A', 'Haji Salim']
	]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'santri');
	XLSX.utils.book_append_sheet(wb, guide, 'Panduan');
	const buf = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));

	return new Response(buf, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="template-import-santri.xlsx"'
		}
	});
}
