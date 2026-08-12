import { supabase } from '$lib/supabase';

export async function uploadSantriPdf(santriId: string, file: File): Promise<string> {
	const path = `santri/${santriId}/${crypto.randomUUID()}.pdf`;
	const { data, error } = await supabase.storage.from('santri').createSignedUploadUrl(path);
	if (error) throw new Error(error.message);

	const { error: upErr } = await supabase.storage.from('santri').uploadToSignedUrl(
		path,
		data.token,
		file,
		{ contentType: 'application/pdf' }
	);
	if (upErr) throw new Error(upErr.message);

	return path;
}
