<script lang="ts">
	import { IconArchive } from '@tabler/icons-svelte';

	let {
		title,
		desc
	}: { title: string; desc: string } = $props();
</script>

<div>
	<header>
		<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
		<p class="mt-1 max-w-[65ch] text-base-content/70">{desc}</p>
	</header>

	<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
		<IconArchive class="mx-auto size-10 text-base-content/40" />
		<h2 class="mt-4 text-lg font-semibold">Fungsi sedang dibangun</h2>
		<p class="mx-auto mt-1 max-w-[55ch] text-sm text-base-content/60">
			Fungsi ini masuk lingkup versi 1 dan akan terpasang bertahap. Rencananya terdokumentasi di
			PRD.
		</p>
	</div>
</div>