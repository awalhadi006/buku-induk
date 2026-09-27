export const load = async ({ url }) => ({
	tab: url.searchParams.get('tab') ?? 'info'
});