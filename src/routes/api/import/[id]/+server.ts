import { json } from '@sveltejs/kit';
import { getProfile, hasRole, ADMIN_ROLES } from '$lib/server/auth';

export const GET = async ({ params, locals }: { params: { id: string }; locals: App.Locals }) => {
	const profile = await getProfile(locals);
	if (!profile || !hasRole(profile, ADMIN_ROLES)) {
		return json({ error: 'Tidak punya izin' }, { status: 403 });
	}

	const { data: job } = await locals.supabase
		.from('import_jobs')
		.select('*')
		.eq('id', params.id)
		.eq('user_id', profile.id)
		.single();

	if (!job) {
		return json({ error: 'Job tidak ditemukan' }, { status: 404 });
	}

	const progress = job.processed_rows || 0;
	const total = job.total_rows || 0;
	const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

	return json({
		id: job.id,
		status: job.status,
		total: total,
		processed: progress,
		berhasil: job.berhasil,
		gagal: job.gagal,
		percent,
		result: job.result,
		fileName: job.file_name,
		createdAt: job.created_at,
		updatedAt: job.updated_at
	});
};