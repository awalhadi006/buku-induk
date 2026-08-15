import { redirect } from '@sveltejs/kit';

const TYPE_LABELS: Record<string, string> = {
	feat: 'Fitur',
	fix: 'Perbaikan',
	docs: 'Dokumentasi',
	style: 'Gaya tampilan',
	refactor: 'Perubahan kode',
	perf: 'Performa',
	test: 'Pengujian',
	chore: 'Pemeliharaan',
	ci: 'CI',
	build: 'Build'
};

function humanize(subject: string): string {
	const m = subject.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(?:\([^)]+\))?!?:\s*(.*)$/i);
	if (m) {
		const label = TYPE_LABELS[m[1].toLowerCase()] ?? m[1];
		const rest = m[2].charAt(0).toUpperCase() + m[2].slice(1);
		return `${label}: ${rest}`;
	}
	return subject.charAt(0).toUpperCase() + subject.slice(1);
}

export async function load({ locals, fetch, setHeaders }) {
	const { user } = locals;
	if (!user) throw redirect(303, '/login');

	const res = await fetch('https://api.github.com/repos/awalhadi006/buku-induk/commits?per_page=30', {
		headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'buku-induk' }
	});

	let commits: { short: string; date: string; subject: string; label: string }[] = [];
	if (res.ok) {
		const data = (await res.json()) as any[];
		commits = data.map((c) => ({
			short: c.sha.slice(0, 7),
			date: (c.commit?.author?.date ?? '').slice(0, 10),
			subject: c.commit?.message?.split('\n')[0] ?? '',
			label: humanize(c.commit?.message?.split('\n')[0] ?? '')
		}));
		setHeaders({ 'cache-control': 'public, max-age=300' });
	}

	return { commits };
}
