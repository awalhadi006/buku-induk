import { PostgrestError } from '@supabase/supabase-js';

function getConstraintName(err: PostgrestError): string | null {
	if (err.details) {
		const match = err.details.match(/constraint\s+"([^"]+)"/i);
		if (match) return match[1];
	}
	if (err.message) {
		const match = err.message.match(/constraint\s+"([^"]+)"/i);
		if (match) return match[1];
	}
	return null;
}

function getColumnName(err: PostgrestError): string | null {
	if (err.details) {
		const match = err.details.match(/key\s+\(([^)]+)\)/i);
		if (match) return match[1];
	}
	return null;
}

export function humanizeError(err: PostgrestError | Error | unknown, context?: string): string {
	if (!err) return 'Terjadi kesalahan tak terduga.';
	if (err instanceof Error) {
		const msg = err.message?.toLowerCase() ?? '';

		// Supabase/Postgrest errors
		if ('code' in err && 'details' in err) {
			const pgErr = err as PostgrestError;
			const constraint = getConstraintName(pgErr);
			const column = getColumnName(pgErr);

			// Unique violations
			if (pgErr.code === '23505' || msg.includes('duplicate key') || msg.includes('unique constraint')) {
				if (constraint?.includes('kamar_nomor_asrama')) {
					return 'Nomor kamar dan asrama ini sudah ada. Gunakan kombinasi nomor + asrama yang berbeda.';
				}
				if (constraint?.includes('kelas_tingkat_rombel') || (column && column.includes('tingkat') && column.includes('rombel'))) {
					return 'Kelas dengan tingkat dan rombel ini sudah ada untuk tahun ajaran yang sama.';
				}
				if (constraint?.includes('wali_santri') || column?.includes('wali')) {
					return 'Data wali ini sudah terdaftar.';
				}
				if (constraint?.includes('santri_nisn') || column?.includes('nisn')) {
					return 'NISN sudah terdaftar untuk santri lain.';
				}
				if (constraint?.includes('santri_nik') || column?.includes('nik')) {
					return 'NIK sudah terdaftar untuk santri lain.';
				}
				if (constraint?.includes('santri_nis') || column?.includes('nis')) {
					return 'NIS sudah terdaftar untuk santri lain.';
				}
				if (constraint?.includes('profiles') || column?.includes('username')) {
					return 'Username sudah digunakan.';
				}
				if (constraint?.includes('email')) {
					return 'Email sudah terdaftar.';
				}
				return 'Data sudah ada (duplikat). Periksa isian yang unik.';
			}

			// Foreign key violations
			if (pgErr.code === '23503' || msg.includes('foreign key') || msg.includes('referenced')) {
				if (constraint?.includes('kamar')) return 'Kamar yang dipilih tidak valid.';
				if (constraint?.includes('kelas')) return 'Kelas yang dipilih tidak valid.';
				if (constraint?.includes('wali')) return 'Data wali yang dipilih tidak valid.';
				if (constraint?.includes('tahun_ajaran')) return 'Tahun ajaran tidak valid.';
				return 'Data terkait tidak ditemukan. Pastikan pilihan masih tersedia.';
			}

			// Not null violations
			if (pgErr.code === '23502' || msg.includes('not-null') || msg.includes('null value')) {
				const col = column ?? constraint ?? 'field wajib';
				return `${col} wajib diisi.`;
			}

			// Check violations
			if (pgErr.code === '23514' || msg.includes('check constraint')) {
				if (constraint?.includes('jenis_kelamin')) return 'Jenis kelamin harus L atau P.';
				if (constraint?.includes('status_santri')) return 'Status santri tidak valid.';
				if (constraint?.includes('status_keluarga')) return 'Status keluarga tidak valid.';
				return 'Isian tidak memenuhi aturan validasi.';
			}
		}

		// Google Drive / upload errors
		if (msg.includes('google') || msg.includes('drive') || msg.includes('upload')) {
			return 'Gagal mengunggah file ke Google Drive. Periksa koneksi dan coba lagi.';
		}

		// Auth errors
		if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
			return 'Username/email atau password salah.';
		}
		if (msg.includes('user not found') || msg.includes('akun tidak ditemukan')) {
			return 'Akun tidak ditemukan.';
		}
		if (msg.includes('email already') || msg.includes('already registered')) {
			return 'Email sudah terdaftar.';
		}

		// Generic fallback
		return 'Terjadi kesalahan. Silakan coba lagi.';
	}

	return String(err);
}

// For validation errors (non-database)
export const validationMessages = {
	required: (field: string) => `${field} wajib diisi.`,
	email: 'Format email tidak valid.',
	passwordMin: 'Kata sandi minimal 6 karakter.',
	passwordMatch: 'Kata sandi baru tidak cocok.',
	positiveNumber: (field: string) => `${field} harus angka lebih dari 0.`,
	invalidId: 'Data tidak valid.',
	invalidSelection: 'Pilihan tidak valid.',
	fileRequired: 'Pilih file terlebih dahulu.',
	fileType: 'Tipe file tidak didukung.',
	emptyFile: 'File kosong.',
	sheetNotFound: 'Sheet tidak ditemukan.',
	patternRequired: 'Pola NIS wajib diisi.',
	patternToken: 'Pola harus mengandung token {NO}.',
	patternNotConfigured: 'Pola NIS belum dikonfigurasi.',
	usernameExists: 'Username sudah digunakan.',
};