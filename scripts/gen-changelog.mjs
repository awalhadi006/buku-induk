/* Auto-generated from `npm run changelog`. Do not edit by hand. */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const TYPE_LABELS = {
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

function humanize(subject) {
	const m = subject.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(?:\([^)]+\))?!?:\s*(.*)$/i);
	if (m) {
		const type = m[1].toLowerCase();
		const rest = m[2].charAt(0).toUpperCase() + m[2].slice(1);
		const label = TYPE_LABELS[type] || type;
		return `${label}: ${rest}`;
	}
	return subject.charAt(0).toUpperCase() + subject.slice(1);
}

let out = '';
try {
	out = execSync('git log --date=short --pretty=format:%H%x1f%ad%x1f%s', { encoding: 'utf8' }).trim();
} catch {
	out = '';
}

const commits = [];
if (out) {
	for (const line of out.split('\n')) {
		const parts = line.split('\x1f');
		const hash = parts[0];
		const date = parts[1];
		const subject = parts.slice(2).join('\x1f');
		commits.push({ short: hash.slice(0, 7), date, subject, label: humanize(subject) });
	}
}

writeFileSync(
	'src/lib/changelog.ts',
	`/* Auto-generated — jangan diedit manual. Regenerasi lewat: npm run changelog */\nexport const changelog = ${JSON.stringify(commits, null, 2)};\n`
);
console.log(`[changelog] ${commits.length} commit tercatat.`);
