export const MAX_FOTO_SIZE = 10 * 1024 * 1024;
export const MAX_DOKUMEN_SIZE = 20 * 1024 * 1024;
export const ALLOWED_FOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ALLOWED_DOKUMEN_TYPES = ['application/pdf'];

export function validateUpload(jenis: string, fileSize: number, mimeType: string): string | null {
	if (jenis === 'foto') {
		if (fileSize > MAX_FOTO_SIZE) return 'Ukuran foto maksimal 10 MB';
		if (!ALLOWED_FOTO_TYPES.includes(mimeType)) return 'Tipe foto harus JPG/PNG';
	} else if (jenis === 'dokumen') {
		if (fileSize > MAX_DOKUMEN_SIZE) return 'Ukuran dokumen maksimal 20 MB';
		if (!ALLOWED_DOKUMEN_TYPES.includes(mimeType)) return 'Tipe dokumen harus PDF';
	} else {
		return 'Jenis tidak valid';
	}
	return null;
}