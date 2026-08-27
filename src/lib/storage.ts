import { supabase } from '$lib/supabase';
import { humanizeError } from '$lib/errors';

export async function uploadSantriPdf(santriId: string, file: File): Promise<string> {
	const path = `santri/${santriId}/${crypto.randomUUID()}.pdf`;
	const { data, error } = await supabase.storage.from('santri').createSignedUploadUrl(path);
	if (error) throw new Error(humanizeError(error));

	const { error: upErr } = await supabase.storage.from('santri').uploadToSignedUrl(
		path,
		data.token,
		file,
		{ contentType: 'application/pdf' }
	);
	if (upErr) throw new Error(humanizeError(upErr));

	return path;
}
