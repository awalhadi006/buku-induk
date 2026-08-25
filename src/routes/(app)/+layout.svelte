<script lang="ts">
	import { onMount } from 'svelte';
	import { page, navigating } from '$app/state';
	import { goto } from '$app/navigation';
	import type { ComponentType } from 'svelte';
	import {
		IconLayoutDashboard,
		IconUsers,
		IconUserHeart,
		IconBed,
		IconSchool,
		IconFileImport,
		IconSettings,
		IconMenu,
		IconX,
		IconLogout,
		IconCheck,
		IconTable,
		IconSearch,
		IconRepeat,
		IconAward,
		IconHistory,
		IconSun,
		IconMoon
	} from '@tabler/icons-svelte';
	import { supabase } from '$lib/supabase';
	import { PERAN_LABEL, type Profile } from '$lib/types';
	import QuickSearch from '$lib/components/QuickSearch.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { photoUrl } from '$lib/gdrive-url';

	let { data, children } = $props();

	const profile = $derived((page.data.profile as Profile | null) ?? null);

	import { NAV_ITEMS, type NavItemDef } from '$lib/nav';

	type NavItem = NavItemDef & { icon: ComponentType };
	const NAV_ICONS: Record<string, ComponentType> = {
		'/': IconLayoutDashboard,
		'/santri': IconUsers,
		'/rekap': IconTable,
		'/wali': IconUserHeart,
		'/kamar': IconBed,
		'/kelas': IconSchool,
		'/kelas/mutasi': IconRepeat,
		'/persetujuan': IconCheck,
		'/import': IconFileImport,
		'/pengaturan': IconSettings,
		'/santri/alumni': IconAward,
		'/updates': IconHistory
	};

	const items: NavItem[] = NAV_ITEMS.map((item) => ({
		...item,
		icon: NAV_ICONS[item.href] ?? IconLayoutDashboard
	}));

	const sidebarNav = $derived(page.data.sidebarNav);

	const visible = $derived(
		items.filter((i) => profile && sidebarNav[i.href]?.includes(profile.peran))
	);

	const initial = $derived(
		(profile?.nama ?? '').trim().charAt(0).toUpperCase() ||
			((page.data.user as { email?: string } | null)?.email ?? '?').charAt(0).toUpperCase()
	);
	const peranLabel = $derived(profile ? PERAN_LABEL[profile.peran] ?? profile.peran : '');

	const pendingRequests = $derived((page.data.pendingRequests as number) ?? 0);

	const schoolName = $derived(data.schoolName ?? 'Buku Induk');
	const schoolLogoUrl = $derived(data.schoolLogoUrl as string | null);

	let open = $state(false);
	let dark = $state(false);

	onMount(() => {
		const attr = document.documentElement.getAttribute('data-theme');
		dark =
			attr === 'bi-dark' ||
			(attr === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
	});

	function toggleTheme() {
		dark = !dark;
		document.documentElement.setAttribute('data-theme', dark ? 'bi-dark' : 'bi-light');
		localStorage.setItem('theme', dark ? 'bi-dark' : 'bi-light');
	}

	function isActive(href: string) {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path.startsWith(href);
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>{schoolName}</title>
	{#if schoolLogoUrl}
		<link rel="icon" href={photoUrl(schoolLogoUrl)} />
	{:else}
		<link rel="icon" href={favicon} />
	{/if}
</svelte:head>

<div class="min-h-[100dvh] bg-base-100 text-base-content">
	<a
		href="#konten-utama"
		class="btn btn-primary btn-sm fixed left-4 top-4 z-50 -translate-y-20 focus-visible:translate-y-0 motion-reduce:transition-none"
	>Lewati ke konten utama</a>

	{#if open}
		<button
			class="fixed inset-0 z-30 bg-black/40 lg:hidden motion-reduce:transition-none"
			aria-label="Tutup menu"
			onclick={() => (open = false)}></button>
	{/if}

	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-base-300 bg-base-100 transition-transform duration-200 lg:translate-x-0 motion-reduce:transition-none
		{open ? 'translate-x-0' : ''}">
		<div class="flex items-center justify-between px-4 pb-3 pt-5">
			<div class="flex min-w-0 items-center gap-2.5">
				{#if schoolLogoUrl}
					<img src={photoUrl(schoolLogoUrl)} alt="Logo" class="size-8 shrink-0 object-contain" />
				{:else}
					<span
						class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-content"
						>BI</span
					>
				{/if}
				<span class="min-w-0 truncate text-sm font-semibold tracking-tight">{schoolName}</span>
			</div>
			<button
				class="btn btn-ghost btn-square btn-sm lg:hidden"
				aria-label="Tutup menu"
				onclick={() => (open = false)}>
				<IconX class="size-5" stroke-width={1.75} />
			</button>
		</div>

		<nav class="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navigasi utama">
			<p
				class="px-2.5 pb-1 pt-2 text-[10px] font-medium tracking-[0.08em] text-base-content/55 uppercase"
				>Menu</p
			>
			<ul class="space-y-0.5">
				{#each visible as item (item.href)}
					{@const active = isActive(item.href)}
					<li>
						<a
							href={item.href}
							onclick={() => (open = false)}
							class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors motion-reduce:transition-none
								{active
									? 'bg-base-200 font-medium text-base-content shadow-[inset_2px_0_0_var(--color-primary)]'
									: 'text-base-content/70 hover:bg-base-200/60 hover:text-base-content'}">
							<item.icon
								class="size-[18px] shrink-0 {active ? 'text-primary' : ''}"
								stroke-width={1.75} />
							<span class="truncate">{item.label}</span>
							{#if item.href === '/persetujuan' && pendingRequests > 0}
								<span class="ml-auto badge badge-error badge-sm" aria-label="Pengajuan menunggu"
									>{pendingRequests}</span
								>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="space-y-1 border-t border-base-300 p-3">
			<button
				type="button"
				class="btn btn-ghost btn-sm w-full justify-start gap-2.5 px-2.5 text-sm font-normal text-base-content/70"
				onclick={toggleTheme}>
				{#if dark}
					<IconSun class="size-[18px]" stroke-width={1.75} aria-hidden="true" />
					Mode terang
				{:else}
					<IconMoon class="size-[18px]" stroke-width={1.75} aria-hidden="true" />
					Mode gelap
				{/if}
			</button>

			<div class="flex items-center gap-2.5 px-1 pt-2">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-base-200 font-medium text-base-content"
					>{initial}</span
				>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium leading-tight">{profile?.nama ?? 'Pengguna'}</p>
					<p class="truncate text-xs text-base-content/60">{peranLabel}</p>
					<a
						href="/pengaturan/ganti-password"
						class="text-[11px] text-primary hover:underline">Ganti kata sandi</a
					>
				</div>
				<button
					class="btn btn-ghost btn-square btn-sm"
					aria-label="Keluar"
					title="Keluar"
					onclick={logout}>
					<IconLogout class="size-5" stroke-width={1.75} />
				</button>
			</div>
		</div>
	</aside>

	<div class="lg:pl-64">
		{#if navigating.to}
			<div
				class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20"
				role="status"
				aria-label="Memuat halaman">
				<div class="nav-progress h-full w-1/3 rounded-full bg-primary"></div>
			</div>
		{/if}

		<header
			class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur lg:hidden">
			<button
				class="btn btn-ghost btn-square btn-sm"
				aria-label="Buka menu"
				onclick={() => (open = true)}>
				<IconMenu class="size-5" stroke-width={1.75} />
			</button>
			<span class="min-w-0 truncate text-sm font-semibold tracking-tight">{schoolName}</span>
			<button
				class="btn btn-ghost btn-square btn-sm ml-auto"
				aria-label="Cari santri, kamar, atau kelas (Ctrl+K)"
				onclick={() => window.dispatchEvent(new Event('quicksearch:open'))}>
				<IconSearch class="size-5" stroke-width={1.75} />
			</button>
		</header>

		<main id="konten-utama" class="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:py-8">
			{@render children()}
		</main>
	</div>
</div>

<QuickSearch />
