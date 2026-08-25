<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { IconSearch, IconUsers, IconBed, IconSchool, IconX } from '@tabler/icons-svelte';

	type Result = {
		type: 'santri' | 'kamar' | 'kelas';
		href: string;
		title: string;
		subtitle: string;
	};

	let open = $state(false);
	let query = $state('');
	let results = $state<Result[]>([]);
	let busy = $state(false);
	let inputEl = $state<HTMLInputElement>();
	let selected = $state(0);
	let timer: ReturnType<typeof setTimeout>;

	const show = $derived(open && query.trim().length > 0);

	function openPalette() {
		open = true;
		query = '';
		results = [];
		selected = 0;
		requestAnimationFrame(() => inputEl?.focus());
	}

	function close() {
		open = false;
		results = [];
	}

	async function search() {
		const q = query.trim();
		if (!q) {
			results = [];
			return;
		}
		busy = true;
		const pattern = `%${q.toLowerCase()}%`;

		// Santri: partial (per karakter) di nama/nisn/nik/nis
		const [santri, kamar, kelas] = await Promise.all([
			supabase
				.from('santri')
				.select('id,nama_lengkap,nisn,kamar(nomor),kelas(tingkat,rombel)')
				.or(
					`nama_lengkap.ilike.${pattern},nisn.ilike.${pattern},nik.ilike.${pattern},nis.ilike.${pattern}`
				)
				.limit(8),
			supabase
				.from('kamar')
				.select('id,nomor')
				.or(`nomor::text.ilike.${pattern}`)
				.limit(3),
			supabase
				.from('kelas')
				.select('id,tingkat,rombel,tahun_ajaran')
				.or(`tingkat.ilike.${pattern},rombel.ilike.${pattern}`)
				.limit(3)
		]);

		const r: Result[] = [];
		for (const s of (santri.data ?? []) as any[]) {
			r.push({
				type: 'santri',
				href: `/santri/${s.id}`,
				title: s.nama_lengkap,
				subtitle: [s.nisn, s.kamar?.nomor != null ? `Kamar ${s.kamar.nomor}` : null, s.kelas ? `${s.kelas.tingkat} ${s.kelas.rombel}` : null]
					.filter(Boolean)
					.join(' · ')
			});
		}
		for (const k of (kamar.data ?? []) as any[]) {
			r.push({ type: 'kamar', href: `/kamar/${k.id}`, title: `Kamar ${k.nomor}`, subtitle: 'Kamar' });
		}
		for (const k of (kelas.data ?? []) as any[]) {
			r.push({
				type: 'kelas',
				href: `/kelas/${k.id}`,
				title: `${k.tingkat} ${k.rombel}`,
				subtitle: k.tahun_ajaran || 'Kelas'
			});
		}

		results = r;
		selected = 0;
		busy = false;
	}

	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(search, 250);
	}

	function choose(res: Result) {
		close();
		goto(res.href);
	}

	function onKeydown(e: KeyboardEvent) {
		// Buka palette
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			openPalette();
			return;
		}
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selected = Math.min(selected + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selected = Math.max(selected - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const r = results[selected];
			if (r) choose(r);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeydown);
		window.addEventListener('quicksearch:open', openPalette);
		return () => {
			window.removeEventListener('keydown', onKeydown);
			window.removeEventListener('quicksearch:open', openPalette);
		};
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/40"
		role="presentation"
		onclick={close}
		onkeydown={onKeydown}></div>

	<div
		class="fixed inset-x-0 top-0 z-60 mx-auto mt-20 w-[min(560px,calc(100vw-2rem))] rounded-2xl border border-base-300 bg-base-100 shadow-2xl overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Pencarian cepat">
		<div class="flex items-center gap-2 border-b border-base-300 px-4 py-3">
			<IconSearch class="size-4 shrink-0 text-base-content/50" />
			<input
				bind:this={inputEl}
				bind:value={query}
				oninput={onInput}
				type="text"
				class="w-full bg-transparent text-sm outline-none placeholder:text-base-content/40"
				placeholder="Cari nama santri, NISN, kamar, atau kelas… (ketik sebagian)"
				autocomplete="off" />
			{#if busy}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			<button class="btn btn-ghost btn-xs btn-square" aria-label="Tutup" onclick={close}>
				<IconX class="size-4" />
			</button>
		</div>

		{#if show}
			{#if results.length === 0}
				<div class="px-4 py-8 text-center text-sm text-base-content/60">
					{query.trim() ? 'Tidak ada hasil.' : 'Ketik untuk mulai mencari…'}
				</div>
			{:else}
				<ul class="max-h-[52vh] overflow-y-auto p-2">
					{#each results as res, i (res.href + res.title)}
						<li>
							<button
								class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm
									{i === selected ? 'bg-primary/10' : 'hover:bg-base-200'}"
								onmouseenter={() => (selected = i)}
								onclick={() => choose(res)}>
								<span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-base-200 text-base-content/60">
									{#if res.type === 'santri'}
										<IconUsers class="size-4" />
									{:else if res.type === 'kamar'}
										<IconBed class="size-4" />
									{:else}
										<IconSchool class="size-4" />
									{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate font-medium">{res.title}</span>
									<span class="block truncate text-xs text-base-content/60">{res.subtitle}</span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<div class="px-4 py-8 text-center text-sm text-base-content/40">
				Ketik minimal 1 huruf untuk mulai mencari
			</div>
		{/if}

		<div class="flex items-center gap-4 border-t border-base-300 px-4 py-2 text-[11px] text-base-content/50">
			<span><kbd class="kbd kbd-xs">Esc</kbd> tutup</span>
			<span><kbd class="kbd kbd-xs">&uarr;</kbd><kbd class="kbd kbd-xs">&darr;</kbd> navigasi</span>
			<span><kbd class="kbd kbd-xs">Enter</kbd> buka</span>
		</div>
	</div>
{/if}