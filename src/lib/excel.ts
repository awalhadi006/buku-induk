export type ImportColumn = {
	header: string;
	field: string;
	group: 'santri' | 'wali' | 'kamar' | 'kelas';
};

export const IMPORT_COLUMNS: ImportColumn[] = [
	{ header: 'Nama lengkap *', field: 'nama_lengkap', group: 'santri' },
	{ header: 'NISN', field: 'nisn', group: 'santri' },
	{ header: 'NIK', field: 'nik', group: 'santri' },
	{ header: 'NIS', field: 'nis', group: 'santri' },
	{ header: 'NIPD', field: 'nipd', group: 'santri' },
	{ header: 'Nama panggilan', field: 'nama_panggilan', group: 'santri' },
	{ header: 'Tempat lahir', field: 'tempat_lahir', group: 'santri' },
	{ header: 'Tanggal lahir', field: 'tanggal_lahir', group: 'santri' },
	{ header: 'Jenis kelamin (L/P)', field: 'jenis_kelamin', group: 'santri' },
	{ header: 'Agama', field: 'agama', group: 'santri' },
	{ header: 'Kewarganegaraan', field: 'kewarganegaraan', group: 'santri' },
	{ header: 'Tempat tinggal', field: 'tempat_tinggal', group: 'santri' },
	{ header: 'Transportasi', field: 'transportasi', group: 'santri' },
	{ header: 'Anak ke', field: 'anak_ke', group: 'santri' },
	{ header: 'No. HP', field: 'no_hp', group: 'santri' },
	{ header: 'Alamat', field: 'alamat', group: 'santri' },
	{ header: 'RT', field: 'rt', group: 'santri' },
	{ header: 'RW', field: 'rw', group: 'santri' },
	{ header: 'Desa/kelurahan', field: 'desa', group: 'santri' },
	{ header: 'Kecamatan', field: 'kecamatan', group: 'santri' },
	{ header: 'Kabupaten', field: 'kabupaten', group: 'santri' },
	{ header: 'No. akta', field: 'no_akta', group: 'santri' },
	{ header: 'No. KK', field: 'no_kk', group: 'santri' },
	{ header: 'Bantuan (KIP/PIP/KPS/PKH)', field: 'bantuan_kip', group: 'santri' },
	{ header: 'Status keluarga', field: 'status_keluarga', group: 'santri' },
	{ header: 'Status santri', field: 'status_santri', group: 'santri' },
	{ header: 'Tanggal masuk', field: 'tanggal_masuk', group: 'santri' },
	{ header: 'Asal sekolah', field: 'asal_sekolah', group: 'santri' },
	{ header: 'Jalur masuk', field: 'jalur_masuk', group: 'santri' },
	{ header: 'Kamar (nomor)', field: 'kamar', group: 'kamar' },
	{ header: 'Kelas (mis. 7A)', field: 'kelas', group: 'kelas' },
	{ header: 'Nama ayah', field: 'nama_ayah', group: 'wali' },
	{ header: 'Nama ibu', field: 'nama_ibu', group: 'wali' },
	{ header: 'Nama wali', field: 'nama_wali', group: 'wali' },
	{ header: 'Pekerjaan ayah', field: 'pekerjaan_ayah', group: 'wali' },
	{ header: 'Pekerjaan ibu', field: 'pekerjaan_ibu', group: 'wali' },
	{ header: 'Penghasilan', field: 'penghasilan', group: 'wali' },
	{ header: 'Alamat wali', field: 'alamat', group: 'wali' },
	{ header: 'No. HP wali', field: 'no_hp', group: 'wali' }
];

export function buildTemplateBuffer(): Uint8Array {
	const ws = XLSX.utils.aoa_to_sheet([IMPORT_COLUMNS.map((c) => c.header)]);
	const guide = XLSX.utils.aoa_to_sheet([
		['Panduan import data santri'],
		[''],
		['1. Isi sheet "data". Baris pertama adalah header — jangan diubah. Data mulai baris 2.'],
		['2. Kolom "Nama lengkap" wajib diisi; kolom lain opsional.'],
		['3. Jenis kelamin: L atau P'],
		['4. Status santri: aktif, khusus, mutasi_keluar, lulus, wafat, drop_out'],
		['5. Status keluarga: yatim, yatim_piatu, dhuafa, umum'],
		['6. Kamar: nomor kamar (contoh: 3). Kelas: tingkat+rombel (contoh: 7A).'],
		['7. Isi nama ayah/ibu/wali agar wali santri ikut tercatat.'],
		[''],
		['Contoh baris 2:'],
		['Nama lengkap', 'NISN', 'Jenis kelamin (L/P)', 'Status santri', 'Kamar (nomor)', 'Kelas (mis. 7A)', 'Nama ayah'],
		['Ahmad Fauzi', '0012345678', 'L', 'aktif', '3', '7A', 'Haji Salim']
	]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'data');
	XLSX.utils.book_append_sheet(wb, guide, 'panduan');
	return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}

// NOTE: Tidak lagi menggunakan EXPORT_HEADERS, langsung bikin CSV di page.server.ts
// export function buildExportBuffer(rows: Record<string, unknown>[]): Uint8Array {
// 	const aoa: unknown[][] = [EXPORT_HEADERS.map((h) => h.header)];
// 	for (const r of rows) {
// 		aoa.push(EXPORT_HEADERS.map((h) => r[h.key] ?? ''));
// 	}
// 	const ws = XLSX.utils.aoa_to_sheet(aoa);
// 	const wb = XLSX.utils.book_new();
// 	XLSX.utils.book_append_sheet(wb, ws, 'santri');
// 	return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
// }
