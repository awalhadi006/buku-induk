export const WALI_COLUMNS = [
	'nama_ayah',
	'nama_ibu',
	'nama_wali',
	'pekerjaan_ayah',
	'pekerjaan_ibu',
	'penghasilan',
	'alamat',
	'no_hp'
] as const;

export function waliLabel(w: {
	nama_ayah?: string | null;
	nama_ibu?: string | null;
	nama_wali?: string | null;
}): string {
	return w.nama_wali || w.nama_ayah || w.nama_ibu || '(wali tanpa nama)';
}

export function parseWaliForm(fd: FormData): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	for (const col of WALI_COLUMNS) {
		const raw = fd.get(col);
		const val = typeof raw === 'string' ? raw.trim() : '';
		if (val) payload[col] = val;
	}
	return payload;
}