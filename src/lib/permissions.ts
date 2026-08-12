import { PERAN_LABEL } from '$lib/types';

export const ROLES = Object.keys(PERAN_LABEL);

export const ABILITIES: { key: string; label: string }[] = [
	{ key: 'santri.view', label: 'Lihat data santri' },
	{ key: 'santri.detail', label: 'Lihat detail santri' },
	{ key: 'santri.create', label: 'Tambah santri' },
	{ key: 'santri.edit', label: 'Ubah santri' },
	{ key: 'santri.edit_nik', label: 'Ubah NIK/NISN' },
	{ key: 'santri.delete', label: 'Hapus santri' },
	{ key: 'wali.view', label: 'Lihat wali santri' },
	{ key: 'wali.create', label: 'Tambah wali santri' },
	{ key: 'wali.edit', label: 'Ubah wali santri' },
	{ key: 'wali.delete', label: 'Hapus wali santri' },
	{ key: 'export', label: 'Cetak & ekspor' },
	{ key: 'import', label: 'Import Excel' },
	{ key: 'dashboard', label: 'Dashboard rekap' },
	{ key: 'users.manage', label: 'Kelola pengguna' },
	{ key: 'roles.manage', label: 'Kelola peran & izin' },
	{ key: 'fields.manage', label: 'Kelola field kustom' },
	{ key: 'ta.manage', label: 'Kelola tahun ajaran' },
	{ key: 'audit.view', label: 'Lihat audit log' }
];