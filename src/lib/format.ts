const fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatTanggal(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const date = new Date(`${iso}T00:00:00`);
	return Number.isNaN(date.getTime()) ? iso : fmt.format(date);
}
