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
		IconMoon,
		IconLayoutSidebarLeftCollapse,
		IconLayoutSidebarLeftExpand
	} from '@tabler/icons-svelte';
	import { supabase } from '$lib/supabase';
	import { PERAN_LABEL, type Profile } from '$lib/types';
	import QuickSearch from '$lib/components/QuickSearch.svelte';
	import { photoUrl } from '$lib/gdrive-url';

	let { data, children } = $props();

	const profile = $derived((page.data.profile as Profile | null) ?? null);

	import { NAV_GROUPS, NAV_ITEMS, type NavItemDef } from '$lib/nav';

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

	const groups = $derived(
		NAV_GROUPS.map((g) => ({
			label: g.label,
			items: visible.filter((i) => g.hrefs.includes(i.href))
		})).filter((g) => g.items.length > 0)
	);

	const initial = $derived(
		(profile?.nama ?? '').trim().charAt(0).toUpperCase() ||
			((page.data.user as { email?: string } | null)?.email ?? '?').charAt(0).toUpperCase()
	);
	const peranLabel = $derived(profile ? PERAN_LABEL[profile.peran] ?? profile.peran : '');

	const pendingRequests = $derived((page.data.pendingRequests as number) ?? 0);

	const schoolName = $derived(data.schoolName ?? 'Buku Induk');
	const schoolLogoUrl = $derived(data.schoolLogoUrl as string | null);
	const tahunAjaran = $derived(data.tahunAjaranAktif as string | null);

	let open = $state(false);
	let dark = $state(false);
	let userMenuOpen = $state(false);
	let rail = $state(typeof localStorage !== 'undefined' && localStorage.getItem('sidebar-rail') === '1');

	onMount(() => {
		const attr = document.documentElement.getAttribute('data-theme');
		dark =
			attr === 'bi-dark' ||
			(attr === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
	});

	function toggleTheme() {
		setDark(!dark);
	}

	function setDark(value: boolean) {
		dark = value;
		document.documentElement.setAttribute('data-theme', value ? 'bi-dark' : 'bi-light');
		localStorage.setItem('theme', value ? 'bi-dark' : 'bi-light');
	}

	function toggleRail() {
		rail = !rail;
		localStorage.setItem('sidebar-rail', rail ? '1' : '0');
	}

	function isActive(href: string) {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path.startsWith(href);
	}

	function onWindowClick(e: MouseEvent) {
		if (!userMenuOpen) return;
		const target = e.target as HTMLElement | null;
		if (!target?.closest('details')) userMenuOpen = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') userMenuOpen = false;
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>{schoolName}</title>
	<!-- Satu-satunya link icon di halaman app: logo sekolah bila ada, fallback bila tidak -->
	{#if schoolLogoUrl}
		<link rel="icon" href="/api/favicon?v={encodeURIComponent(schoolLogoUrl)}" />
	{:else}
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	{/if}
</svelte:head>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

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
		class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-base-300 bg-base-100 sidebar-drawer lg:translate-x-0 motion-reduce:transition-none {rail
			? 'lg:w-[76px]'
			: ''} {open ? 'translate-x-0' : ''}">
		<div
		class="flex items-center justify-between gap-2 px-4 pb-3 pt-5 {rail
			? 'lg:flex-col lg:items-center lg:justify-start lg:px-2 lg:pt-4 lg:pb-2'
			: ''}">
			<div class="flex min-w-0 items-center gap-2.5">
				{#if schoolLogoUrl}
					<img src={photoUrl(schoolLogoUrl)} alt="Logo" class="size-8 shrink-0 object-contain" />
				{:else}
					<span
						class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-content"
						>BI</span
					>
				{/if}
				<span class="min-w-0 truncate text-sm font-semibold tracking-tight {rail ? 'lg:hidden' : ''}"
					>{schoolName}</span
				>
			</div>
			<button
				type="button"
				class="btn btn-ghost btn-square btn-sm hidden lg:inline-flex"
				aria-label={rail ? 'Perlebar menu' : 'Persempit menu'}
				title={rail ? 'Perlebar menu' : 'Persempit menu'}
				onclick={toggleRail}>
				{#if rail}
					<IconLayoutSidebarLeftExpand class="size-[18px]" stroke-width={1.75} />
				{:else}
					<IconLayoutSidebarLeftCollapse class="size-[18px]" stroke-width={1.75} />
				{/if}
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-square btn-sm lg:hidden"
				aria-label="Tutup menu"
				onclick={() => (open = false)}>
				<IconX class="size-5" stroke-width={1.75} />
			</button>
		</div>

		{#if tahunAjaran}
			<div class="px-3 pb-1 {rail ? 'lg:hidden' : ''}">
				<div
					class="flex items-center gap-2 rounded-lg bg-base-200/60 px-3 py-1.5 text-[11px] font-medium text-base-content/70"
					title="Tahun ajaran aktif">
					<span class="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
					<span class="truncate">T.A. {tahunAjaran}</span>
				</div>
			</div>
		{/if}

		<nav
			class="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 {rail ? 'lg:overflow-visible' : ''}"
			aria-label="Navigasi utama">
			{#each groups as group, gi (group.label)}
				{#if rail && gi > 0}
					<div class="mt-px mb-px mx-auto hidden h-px w-4 bg-base-300/60 lg:block" aria-hidden="true"
					></div>
				{:else if !rail}
					<p class="px-2.5 pb-1 pt-3 text-[10px] font-medium tracking-[0.08em] text-base-content/55 uppercase {gi === 0 ? 'pt-2' : ''}"
						>{group.label}</p
					>
				{/if}
				<ul class="space-y-0.5">
					{#each group.items as item (item.href)}
						{@const active = isActive(item.href)}
						<li>
							<a
								href={item.href}
								onclick={() => (open = false)}
								aria-current={active ? 'page' : undefined}
								aria-label={rail ? item.label : undefined}
								class="group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors motion-reduce:transition-none
									{active
									? 'bg-primary font-medium text-primary-content'
									: 'text-base-content/70 hover:bg-base-200/60 hover:text-base-content'}
									{rail ? 'lg:justify-center lg:px-0' : ''}">
								<item.icon class="size-[18px] shrink-0" stroke-width={active ? 2 : 1.75} />
								<span class="truncate {rail ? 'lg:hidden' : ''}">{item.label}</span>
								{#if rail}
									<span
										class="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs font-medium text-base-content opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block motion-reduce:transition-none"
										role="tooltip">{item.label}</span
									>
								{/if}
								{#if item.href === '/persetujuan' && pendingRequests > 0}
									<span
										class="badge badge-sm ml-auto {active ? 'badge-neutral' : 'badge-error'} {rail
											? 'lg:absolute lg:top-0.5 lg:right-1.5 lg:ml-0 lg:min-h-0 lg:px-1 lg:py-0 lg:text-[9px] lg:leading-4'
											: ''}"
										aria-label="Pengajuan menunggu">{pendingRequests}</span
									>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</nav>
	</aside>

	<div class={rail ? 'lg:pl-[76px]' : 'lg:pl-64'}>
		{#if navigating.to}
			<div
				class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20"
				role="status"
				aria-label="Memuat halaman">
				<div class="nav-progress h-full w-1/3 rounded-full bg-primary"></div>
			</div>
		{/if}

		<header
			class="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur">
			<button
				class="btn btn-ghost btn-square btn-sm lg:hidden"
				aria-label="Buka menu"
				onclick={() => (open = true)}>
				<IconMenu class="size-5" stroke-width={1.75} />
			</button>
			<span class="min-w-0 truncate text-sm font-semibold tracking-tight lg:hidden"
				>{schoolName}</span
			>

			<div class="ml-auto flex items-center gap-1">
				<button
					type="button"
					class="group relative btn btn-ghost btn-square btn-sm"
					onclick={toggleTheme}
					aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}>
					{#if dark}
						<IconSun class="size-[18px]" stroke-width={1.75} aria-hidden="true" />
					{:else}
						<IconMoon class="size-[18px]" stroke-width={1.75} aria-hidden="true" />
					{/if}
					<span class="pointer-events-none absolute -bottom-9 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs font-medium text-base-content opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 sm:block motion-reduce:transition-none"
						role="tooltip">{dark ? 'Mode terang' : 'Mode gelap'}</span
					>
				</button>

				<button
					class="group relative btn btn-ghost btn-square btn-sm"
					aria-label="Cari santri, kamar, atau kelas (Ctrl+K)"
					onclick={() => window.dispatchEvent(new Event('quicksearch:open'))}>
					<IconSearch class="size-[18px]" stroke-width={1.75} />
					<span class="pointer-events-none absolute -bottom-9 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs font-medium text-base-content opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 sm:block motion-reduce:transition-none"
						role="tooltip">Cari (Ctrl+K)</span
					>
				</button>

				<details bind:open={userMenuOpen} class="dropdown dropdown-end group ml-2">
					<summary
						class="flex cursor-pointer list-none items-center rounded-full [&::-webkit-details-marker]:hidden"
						aria-label="Menu pengguna">
						<span
							class="flex size-8 items-center justify-center rounded-full bg-primary font-medium text-primary-content"
							>{initial}</span
						>
						{#if !userMenuOpen}
							<span
								class="pointer-events-none absolute -bottom-9 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs font-medium text-base-content opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 sm:block motion-reduce:transition-none"
								role="tooltip">{profile?.nama ?? 'Pengguna'}</span
							>
						{/if}
					</summary>
					<div
						class="dropdown-content z-50 mt-2 w-56 rounded-lg border border-base-300 bg-base-100 p-2 shadow-lg">
						<div class="border-b border-base-200 px-2 pb-2 pt-1">
							<p class="truncate text-sm font-medium">{profile?.nama ?? 'Pengguna'}</p>
							<p class="truncate text-xs text-base-content/60">{peranLabel}</p>
						</div>
						<a
							href="/pengaturan/ganti-password"
							onclick={() => (userMenuOpen = false)}
							class="mt-1 block rounded-md px-2 py-1.5 text-sm text-base-content/80 hover:bg-base-200/60 hover:text-base-content">
							Ganti kata sandi
						</a>
						<button
							type="button"
							class="mt-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-error hover:bg-error/10"
							onclick={logout}>
							<IconLogout class="size-4" stroke-width={1.75} aria-hidden="true" />
							Keluar
						</button>
					</div>
				</details>
			</div>
		</header>

		<main id="konten-utama" class="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:py-8">
			{@render children()}
		</main>
	</div>
</div>

<QuickSearch />
