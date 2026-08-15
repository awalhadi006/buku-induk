import { json, error } from '@sveltejs/kit';

export const POST = async ({ locals, request }) => {
	const { user, supabase } = locals;
	if (!user) throw error(401, 'Tidak terautentikasi');

	const fd = await request.formData();
	const file = fd.get('file') as File | null;
	const name = (fd.get('name') as string) ?? 'Santri';
	if (!file || file.size === 0) throw error(400, 'Pilih file foto terlebih dahulu.');

	const { uploadPhoto } = await import('$lib/gdrive');
	let url: string;
	try {
		url = await uploadPhoto(supabase, file, name);
	} catch (e) {
		throw error(500, e instanceof Error ? e.message : 'Gagal mengunggah foto ke Google Drive.');
	}
	return json({ url });
};
