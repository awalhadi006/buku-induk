import { validateUpload, MAX_FOTO_SIZE, MAX_DOKUMEN_SIZE, ALLOWED_FOTO_TYPES, ALLOWED_DOKUMEN_TYPES } from '$lib/gdrive/validation';

describe('validateUpload', () => {
	describe('foto', () => {
		it('returns null for valid JPEG under 10MB', () => {
			const err = validateUpload('foto', 1024 * 1024, 'image/jpeg');
			expect(err).toBeNull();
		});
		it('returns null for valid JPG under 10MB', () => {
			const err = validateUpload('foto', 1024 * 1024, 'image/jpg');
			expect(err).toBeNull();
		});
		it('returns null for valid PNG under 10MB', () => {
			const err = validateUpload('foto', 1024 * 1024, 'image/png');
			expect(err).toBeNull();
		});
		it('returns null for file at 10MB limit', () => {
			const err = validateUpload('foto', MAX_FOTO_SIZE, 'image/jpeg');
			expect(err).toBeNull();
		});
		it('returns error for file over 10MB', () => {
			const err = validateUpload('foto', MAX_FOTO_SIZE + 1, 'image/jpeg');
			expect(err).toBe('Ukuran foto maksimal 10 MB');
		});
		it('returns error for invalid MIME type (webp)', () => {
			const err = validateUpload('foto', 1024, 'image/webp');
			expect(err).toBe('Tipe foto harus JPG/PNG');
		});
		it('returns error for invalid MIME type (pdf)', () => {
			const err = validateUpload('foto', 1024, 'application/pdf');
			expect(err).toBe('Tipe foto harus JPG/PNG');
		});
	});

	describe('dokumen', () => {
		it('returns null for valid PDF under 20MB', () => {
			const err = validateUpload('dokumen', 1024 * 1024, 'application/pdf');
			expect(err).toBeNull();
		});
		it('returns null for file at 20MB limit', () => {
			const err = validateUpload('dokumen', MAX_DOKUMEN_SIZE, 'application/pdf');
			expect(err).toBeNull();
		});
		it('returns error for file over 20MB', () => {
			const err = validateUpload('dokumen', MAX_DOKUMEN_SIZE + 1, 'application/pdf');
			expect(err).toBe('Ukuran dokumen maksimal 20 MB');
		});
		it('returns error for invalid MIME type (jpeg)', () => {
			const err = validateUpload('dokumen', 1024, 'image/jpeg');
			expect(err).toBe('Tipe dokumen harus PDF');
		});
		it('returns error for invalid MIME type (png)', () => {
			const err = validateUpload('dokumen', 1024, 'image/png');
			expect(err).toBe('Tipe dokumen harus PDF');
		});
	});

	describe('invalid jenis', () => {
		it('returns error for unknown jenis', () => {
			const err = validateUpload('video', 1024, 'video/mp4');
			expect(err).toBe('Jenis tidak valid');
		});
		it('returns error for empty jenis', () => {
			const err = validateUpload('', 1024, 'image/jpeg');
			expect(err).toBe('Jenis tidak valid');
		});
	});
});