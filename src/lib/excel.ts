import * as XLSX from 'xlsx';

export type ImportColumn = {
	header: string;
	field: string;
	group: 'santri' | 'wali' | 'kamar' | 'kelas';
};

export const IMPORT_COLUMNS: ImportColumn[] = [
	{ header: 'Nama lengkap *', field: 'nama_lengkap', group: 'santri' },
	{ header: 'NIS', field: 'nis', group: 'santri' },
	{ header: 'NISN', field: 'nisn', group: 'santri' },
	{ header: 'NIK', field: 'nik', group: 'santri' },
	{ header: 'Nama panggilan', field: 'nama_panggilan', group: 'santri' },
	{ header: 'Tempat lahir', field: 'tempat_lahir', group: 'santri' },
	{ header: 'Tanggal lahir', field: 'tanggal_lahir', group: 'santri' },
	{ header: 'Jenis kelamin (L/P)', field: 'jenis_kelamin', group: 'santri' },
	{ header: 'Agama', field: 'agama', group: 'santri' },
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

export const WAJIB_FIELDS = [
	'nama_lengkap',
	'nis',
	'nisn',
	'tempat_lahir',
	'tanggal_lahir',
	'jenis_kelamin',
	'alamat',
	'nama_ayah',
	'nama_ibu'
] as const;

// ponytail: find() ambil kemunculan pertama — kolom 'alamat'/'no_hp' ada di grup santri DAN wali
export const WAJIB_COLUMNS = WAJIB_FIELDS.map((f) =>
	IMPORT_COLUMNS.find((c) => c.field === f)
).filter((c) => c != null);
export const OPSIONAL_COLUMNS = IMPORT_COLUMNS.filter((c) => !WAJIB_COLUMNS.includes(c));

function sheetFromColumns(columns: ImportColumn[], tableName: string) {
	const ws = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header)]);
	const ref = ws['!ref'] || 'A1';
	const range = XLSX.utils.decode_range(ref);
	ws['!tbls'] = [{
		name: tableName,
		ref: XLSX.utils.encode_range({ s: range.s, e: { r: range.e.r, c: range.e.c } }),
		style: { theme: 'TableStyleMedium2', showRowStripes: true }
	}];
	return ws;
}

export function buildTemplateBuffer(): Uint8Array {
	const guide = XLSX.utils.aoa_to_sheet([
		['Panduan import data santri'],
		[''],
		['1. Ada dua sheet data: "data wajib" dan "data opsional". Baris pertama adalah header — jangan diubah. Data mulai baris 2.'],
		['2. Baris di kedua sheet harus sejajar: baris 2 "data wajib" dan baris 2 "data opsional" adalah santri yang sama.'],
		['3. Kolom NIS ada di KEDUA sheet sebagai kunci pencocokan — isinya harus sama. Kalau berbeda, baris tersebut ditolak saat import.'],
		['4. Kolom wajib (Nama, NIS, NISN, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Alamat, Nama Ayah, Nama Ibu) sebaiknya terisi semua; sisanya opsional.'],
		['5. Jenis kelamin: L atau P'],
		['6. RT/RW otomatis jadi 3 digit (contoh: 9 atau 09 tersimpan sebagai 009).'],
		['7. Tanggal lahir bebas formatnya: 10/11/2026, 10-11-2026, atau 10 November 2026 — otomatis dirapikan sistem.'],
		['8. Status santri: aktif, khusus, mutasi_keluar, lulus, wafat, drop_out'],
		['9. Status keluarga: yatim, yatim_piatu, dhuafa, umum'],
		['10. Kamar: nomor kamar (contoh: 3). Kelas: tingkat+rombel (contoh: 7A).'],
		[''],
		['Contoh baris 2 sheet "data wajib":'],
		['Nama lengkap', 'NIS', 'NISN', 'Jenis kelamin (L/P)', 'Tempat lahir', 'Tanggal lahir', 'Alamat', 'Nama ayah', 'Nama ibu'],
		['Ahmad Fauzi', '2410001', '0012345678', 'L', 'Yogyakarta', '10 November 2010', 'Jl. Kaliurang No. 9 RT 009 RW 012', 'Haji Salim', 'Siti Aminah']
	]);

	const wb = XLSX.utils.book_new();
	const nisCol = IMPORT_COLUMNS.find((c) => c.field === 'nis');
	XLSX.utils.book_append_sheet(wb, sheetFromColumns(WAJIB_COLUMNS, 'DataWajib'), 'data wajib');
	XLSX.utils.book_append_sheet(
		wb,
		sheetFromColumns([nisCol!, ...OPSIONAL_COLUMNS], 'DataOpsional'),
		'data opsional'
	);
	XLSX.utils.book_append_sheet(wb, guide, 'panduan');
	return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}

export const IMPORT_HEADERS = IMPORT_COLUMNS.map((c) => c.header);

export function normalizeHeader(h: string): string {
	return h
		.toLowerCase()
		.replace(/\*/g, '')
		.replace(/\(.*?\)/g, '')
		.replace(/[^a-z0-9]/g, '')
		.trim();
}

export function mergeSheetRows(
	wajib: Record<string, string>[],
	opsional: Record<string, string>[]
): Record<string, string>[] {
	const len = Math.max(wajib.length, opsional.length);
	const merged: Record<string, string>[] = [];
	for (let i = 0; i < len; i++) merged.push({ ...(opsional[i] ?? {}), ...(wajib[i] ?? {}) });
	return merged;
}

export function buildExportBuffer(headers: string[], rows: unknown[][]): Uint8Array {
	const aoa: unknown[][] = [headers, ...rows];
	const ws = XLSX.utils.aoa_to_sheet(aoa);

	// Define the table range
	const ref = ws['!ref'] || 'A1:AM1';
	const range = XLSX.utils.decode_range(ref);
	const tableRange = { s: range.s, e: { r: rows.length, c: range.e.c } };

	// Define Table (ListObject)
	ws['!tbls'] = [{
		name: 'SantriTable',
		ref: XLSX.utils.encode_range(tableRange),
		style: { theme: 'TableStyleMedium2', showRowStripes: true }
	}];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'santri');
	return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}
