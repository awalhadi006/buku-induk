import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const headers = [
	'Nama lengkap *',
	'NISN',
	'NIK',
	'NIS',
	'NIPD',
	'Nama panggilan',
	'Tempat lahir',
	'Tanggal lahir',
	'Jenis kelamin (L/P)',
	'Agama',
	'Kewarganegaraan',
	'Tempat tinggal',
	'Transportasi',
	'Anak ke',
	'No. HP',
	'Alamat',
	'RT',
	'RW',
	'Desa/kelurahan',
	'Kecamatan',
	'Kabupaten',
	'No. akta',
	'No. KK',
	'Bantuan (KIP/PIP/KPS/PKH)',
	'Status keluarga',
	'Status santri',
	'Tanggal masuk',
	'Asal sekolah',
	'Jalur masuk',
	'Kamar (nomor)',
	'Kelas (mis. 7A)',
	'Nama ayah',
	'Nama ibu',
	'Nama wali',
	'Pekerjaan ayah',
	'Pekerjaan ibu',
	'Penghasilan',
	'Alamat wali',
	'No. HP wali'
];

const ws = XLSX.utils.aoa_to_sheet([headers]);
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
	['Ahmad Fauzi', '0012345678', 'L', 'aktif', '3', '7A', 'Haji Salim']
]);

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'data');
XLSX.utils.book_append_sheet(wb, guide, 'panduan');

const XLSXNode = typeof process !== 'undefined' && process.versions && process.versions.node;
if (XLSXNode) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const outputPath = path.join(__dirname, 'public', 'template-import-santri.xlsx');
	fs.writeFileSync(outputPath, Buffer.from(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })));
	console.log('Template created:', outputPath);
} else {
	// Browser mode
	const buf = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
	console.log('Buffer size:', buf.length);
}
