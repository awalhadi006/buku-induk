export const STATUS_SANTRI_OPTIONS = [
	{ value: 'aktif', label: 'Aktif' },
	{ value: 'khusus', label: 'Khusus' },
	{ value: 'mutasi_keluar', label: 'Mutasi Keluar' },
	{ value: 'lulus', label: 'Lulus' },
	{ value: 'wafat', label: 'Wafat' },
	{ value: 'drop_out', label: 'Drop Out' }
];

export const STATUS_SANTRI_LABEL: Record<string, string> = Object.fromEntries(
	STATUS_SANTRI_OPTIONS.map((o) => [o.value, o.label])
);

export const STATUS_KELUARGA_OPTIONS = [
	{ value: 'yatim', label: 'Yatim' },
	{ value: 'yatim_piatu', label: 'Yatim-Piatu' },
	{ value: 'dhuafa', label: 'Dhuafa' },
	{ value: 'umum', label: 'Umum' }
];

export const STATUS_KELUARGA_LABEL: Record<string, string> = Object.fromEntries(
	STATUS_KELUARGA_OPTIONS.map((o) => [o.value, o.label])
);

export const GENDER_OPTIONS = [
	{ value: 'L', label: 'Laki-laki' },
	{ value: 'P', label: 'Perempuan' }
];

export const GENDER_LABEL: Record<string, string> = Object.fromEntries(
	GENDER_OPTIONS.map((o) => [o.value, o.label])
);

export const JENIS_DOKUMEN_OPTIONS = [
	{ value: 'kk', label: 'Kartu Keluarga (KK)' },
	{ value: 'akta', label: 'Akta Kelahiran' },
	{ value: 'ijazah', label: 'Ijazah' },
	{ value: 'skl', label: 'SKL' },
	{ value: 'lainnya', label: 'Lainnya' }
];

export const JENIS_DOKUMEN_LABEL: Record<string, string> = Object.fromEntries(
	JENIS_DOKUMEN_OPTIONS.map((o) => [o.value, o.label])
);

export const SANTRI_COLUMNS = [
	'nisn',
	'nik',
	'nis',
	'nama_lengkap',
	'nama_panggilan',
	'tempat_lahir',
	'tanggal_lahir',
	'jenis_kelamin',
	'agama',
	'tempat_tinggal',
	'transportasi',
	'anak_ke',
	'no_hp',
	'alamat',
	'rt',
	'rw',
	'desa',
	'kecamatan',
	'kabupaten',
	'no_akta',
	'no_kk',
	'bantuan_kip',
	'status_keluarga',
	'status_santri',
	'tanggal_masuk',
	'asal_sekolah',
	'jalur_masuk',
	'kamar_id',
	'kelas_id',
	'wali_santri_id',
	'foto_url'
] as const;

export const EMPTY_SANTRI: Record<string, string> = Object.fromEntries(
	SANTRI_COLUMNS.map((c) => [c, ''])
);

export function parseSantriForm(
	fd: FormData,
	customFieldNames?: string[]
): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	for (const col of SANTRI_COLUMNS) {
		const raw = fd.get(col);
		const val = typeof raw === 'string' ? raw.trim() : '';
		if (!val) continue;
		if (col === 'anak_ke' || col === 'kamar_id' || col === 'kelas_id') {
			const n = Number(val);
			payload[col] = Number.isFinite(n) ? n : null;
		} else {
			payload[col] = val;
		}
	}
	if (customFieldNames?.length) {
		const custom: Record<string, unknown> = {};
		for (const name of customFieldNames) {
			const raw = fd.get(`custom_${name}`);
			if (typeof raw === 'string') {
				const trimmed = raw.trim();
				if (trimmed) custom[name] = trimmed;
			}
		}
		if (Object.keys(custom).length > 0) payload.custom = custom;
	}
	return payload;
}
