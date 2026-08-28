import { validateUpload } from '$lib/gdrive/validation';

export async function uploadToGDrive(
	file: File,
	santriId: string,
	jenis: 'foto' | 'dokumen',
	fileNameOverride?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const validationErr = validateUpload(jenis, file.size, file.type);
	if (validationErr) return { ok: false, error: validationErr };

	const initRes = await fetch('/api/gdrive/init', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			santriId,
			jenis
		})
	});

	if (!initRes.ok) {
		const body = await initRes.json().catch(() => ({ error: '' })) as { error?: string };
		return { ok: false, error: body.error ?? 'Gagal membuat session upload' };
	}

	const { sessionUrl, fileId } = await initRes.json() as { sessionUrl: string; fileId: string };

	const uploadRes = await fetch(sessionUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': file.type,
			'X-Upload-Content-Length': String(file.size)
		},
		body: file
	});

	if (!uploadRes.ok) {
		return { ok: false, error: 'Upload ke Google Drive gagal' };
	}

	const completeRes = await fetch('/api/gdrive/completed', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			fileId,
			santriId,
			jenis,
			fileName: fileNameOverride ?? file.name
		})
	});

	if (!completeRes.ok) {
		const body = await completeRes.json().catch(() => ({ error: '' })) as { error?: string };
		return { ok: false, error: body.error ?? 'Gagal menyimpan record' };
	}

	return { ok: true };
}