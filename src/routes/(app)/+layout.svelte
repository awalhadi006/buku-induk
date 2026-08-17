<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { ComponentType } from 'svelte';
	import {
		IconLayoutDashboard,
		IconUsers,
		IconUserHeart,
		IconArrowsUp,
		IconBed,
		IconSchool,
		IconFileImport,
		IconSettings,
		IconMenu,
		IconX,
		IconLogout,
		IconChevronDown,
		IconCheck,
		IconSparkles,
		IconSearch,
		IconRepeat,
		IconAward
	} from '@tabler/icons-svelte';
	import { supabase } from '$lib/supabase';
	import { PERAN_LABEL, type Profile } from '$lib/types';
	import QuickSearch from '$lib/components/QuickSearch.svelte';

	let { children } = $props();

	const profile = $derived((page.data.profile as Profile | null) ?? null);

	type NavItem = { href: string; label: string; icon: ComponentType; roles: string[] | 'all' };
	const items: NavItem[] = [
		{ href: '/', label: 'Rekapitulasi', icon: IconLayoutDashboard, roles: 'all' },
		{ href: '/santri', label: 'Santri', icon: IconUsers, roles: 'all' },
		{ href: '/santri/mass-update', label: 'Update Massal', icon: IconArrowsUp, roles: ['superadmin', 'admin_tu'] },
		{ href: '/rekap', label: 'Rekap Kamar/Kelas', icon: IconChevronDown, roles: ['superadmin', 'admin_tu'] },
		{ href: '/wali', label: 'Wali Santri', icon: IconUserHeart, roles: ['superadmin', 'admin_tu'] },
		{ href: '/kamar', label: 'Kamar', icon: IconBed, roles: ['superadmin', 'admin_tu'] },
		{ href: '/kelas', label: 'Kelas', icon: IconSchool, roles: ['superadmin', 'admin_tu'] },
		{
			href: '/kelas/mutasi',
			label: 'Mutasi Kelas & Lulus',
			icon: IconRepeat,
			roles: ['superadmin', 'admin_tu']
		},
		{ href: '/persetujuan', label: 'Persetujuan Data', icon: IconCheck, roles: ['superadmin', 'admin_tu'] },
		{ href: '/import', label: 'Import Excel', icon: IconFileImport, roles: ['superadmin', 'admin_tu'] },
		{ href: '/pengaturan', label: 'Pengaturan', icon: IconSettings, roles: ['superadmin'] },
		{ href: '/updates', label: 'Apa yang Baru', icon: IconSparkles, roles: 'all' },
		{
			href: '/santri/alumni',
			label: 'Arsip Alumni',
			icon: IconAward,
			roles: ['superadmin', 'admin_tu']
		}
	];

	const visible = $derived(
		items.filter((i) => i.roles === 'all' || (profile && i.roles.includes(profile.peran)))
	);

	const initial = $derived(
		(profile?.nama ?? '').trim().charAt(0).toUpperCase() ||
			((page.data.user as { email?: string } | null)?.email ?? '?').charAt(0).toUpperCase()
	);
	const peranLabel = $derived(profile ? PERAN_LABEL[profile.peran] ?? profile.peran : '');

	const pendingRequests = $derived((page.data.pendingRequests as number) ?? 0);

	let open = $state(false);
	let theme = $state('');

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved) {
			theme = saved;
			document.documentElement.setAttribute('data-theme', saved);
		}
	});

	function setTheme(value: string) {
		theme = value;
		if (value) {
			document.documentElement.setAttribute('data-theme', value);
			localStorage.setItem('theme', value);
		} else {
			document.documentElement.removeAttribute('data-theme');
			localStorage.removeItem('theme');
		}
	}

	const THEMES = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'cupcake', label: 'Cupcake' },
		{ value: 'bumblebee', label: 'Bumblebee' },
		{ value: 'emerald', label: 'Emerald' },
		{ value: 'corporate', label: 'Corporate' },
		{ value: 'synthwave', label: 'Synthwave' },
		{ value: 'retro', label: 'Retro' },
		{ value: 'cyberpunk', label: 'Cyberpunk' },
		{ value: 'valentine', label: 'Valentine' },
		{ value: 'halloween', label: 'Halloween' },
		{ value: 'garden', label: 'Garden' },
		{ value: 'forest', label: 'Forest' },
		{ value: 'aqua', label: 'Aqua' },
		{ value: 'lofi', label: 'Lofi' },
		{ value: 'pastel', label: 'Pastel' },
		{ value: 'fantasy', label: 'Fantasy' },
		{ value: 'wireframe', label: 'Wireframe' },
		{ value: 'black', label: 'Black' },
		{ value: 'luxury', label: 'Luxury' },
		{ value: 'dracula', label: 'Dracula' },
		{ value: 'cmyk', label: 'CMYK' },
		{ value: 'autumn', label: 'Autumn' },
		{ value: 'business', label: 'Business' },
		{ value: 'acid', label: 'Acid' },
		{ value: 'lemonade', label: 'Lemonade' },
		{ value: 'night', label: 'Night' },
		{ value: 'coffee', label: 'Coffee' },
		{ value: 'winter', label: 'Winter' },
		{ value: 'dim', label: 'Dim (gelap)' },
		{ value: 'nord', label: 'Nord' },
		{ value: 'sunset', label: 'Sunset' }
	];

	function isActive(href: string) {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path.startsWith(href);
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="min-h-[100dvh] bg-base-100 text-base-content">
	{#if open}
		<button
			class="fixed inset-0 z-30 bg-black/40 lg:hidden motion-reduce:transition-none"
			aria-label="Tutup menu"
			onclick={() => (open = false)}></button>
	{/if}

	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-base-300 bg-base-100 transition-transform duration-200 lg:translate-x-0 motion-reduce:transition-none
		{open ? 'translate-x-0' : ''}">
		<div class="flex items-center justify-between px-5 pb-4 pt-6">
			<div class="flex items-center gap-3">
				<span
					class="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-lg font-bold text-primary"
					>BI</span
				>
				<span class="font-semibold tracking-tight">Buku Induk</span>
			</div>
			<button
				class="btn btn-ghost btn-square btn-sm lg:hidden"
				aria-label="Tutup menu"
				onclick={() => (open = false)}>
				<IconX class="size-5" stroke-width={1.75} />
			</button>
		</div>

		<nav class="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Navigasi utama">
			{#each visible as item}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				onclick={() => (open = false)}
				class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors
					{active ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}">
				<item.icon class="size-5" stroke-width={1.75} />
				<span>{item.label}</span>
				{#if item.href === '/persetujuan' && pendingRequests > 0}
					<span class="ml-auto badge badge-error badge-sm" aria-label="Pengajuan menunggu">{pendingRequests}</span>
				{/if}
			</a>
			{/each}
		</nav>

		<div class="space-y-4 border-t border-base-300 p-4">
			<div class="dropdown">
				<div tabindex="0" role="button" class="btn btn-ghost btn-sm w-full justify-between">
					<span class="text-xs font-medium text-base-content/60">Tema</span>
					<IconChevronDown class="size-4 text-base-content/50" stroke-width={1.75} />
				</div>
				<div
					tabindex="0"
					role="menu"
					class="dropdown-content fixed bottom-32 left-4 z-[60] w-64 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
					<p class="mb-2 text-xs font-medium text-base-content/50">Pilih tema</p>
					<div class="grid max-h-64 grid-cols-3 gap-1.5 overflow-y-auto p-0.5 pr-1">
						<button
							type="button"
							onclick={() => setTheme('')}
							class="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-[11px] text-base-content/80 hover:bg-base-200
							{theme === '' ? 'ring-1 ring-primary' : ''}">
							<span
								class="flex size-8 w-full items-center justify-center rounded-lg border border-dashed border-base-content/30 text-[10px] font-medium"
								style="background: linear-gradient(135deg, var(--color-primary) 50%, var(--color-base-100) 50%)"
								>Auto</span
							>
							<span class="w-full truncate text-center">Ikut perangkat</span>
						</button>
						{#each THEMES as t (t.value)}
							<button
								type="button"
								onclick={() => setTheme(t.value)}
								class="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-[11px] text-base-content/80 hover:bg-base-200
								{theme === t.value ? 'ring-1 ring-primary' : ''}">
								<span
									class="relative size-8 w-full rounded-lg ring-1 ring-base-content/15"
									data-theme={t.value}
									style="background: linear-gradient(135deg, var(--color-primary) 50%, var(--color-base-100) 50%)">
									{#if theme === t.value}
										<IconCheck
											class="absolute inset-0 m-auto size-4 text-base-content mix-blend-difference"
											stroke-width={3} />
									{/if}
								</span>
								<span class="w-full truncate text-center">{t.label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
					>{initial}</span
				>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{profile?.nama ?? 'Pengguna'}</p>
					<p class="truncate text-xs text-base-content/60">{peranLabel}</p>
					<a href="/pengaturan/ganti-password" class="text-[10px] text-primary hover:underline">Ganti kata sandi</a>
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

	<div class="lg:pl-72">
		<header
			class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur lg:hidden">
			<button
				class="btn btn-ghost btn-square btn-sm"
				aria-label="Buka menu"
				onclick={() => (open = true)}>
				<IconMenu class="size-5" stroke-width={1.75} />
			</button>
			<span class="font-semibold tracking-tight">Buku Induk</span>
			<button
				class="btn btn-ghost btn-square btn-sm ml-auto"
				aria-label="Cari santri, kamar, atau kelas (Ctrl+K)"
				onclick={() => window.dispatchEvent(new Event('quicksearch:open'))}>
				<IconSearch class="size-5" stroke-width={1.75} />
			</button>
		</header>

		<main class="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:py-8">
			{@render children()}
		</main>
	</div>
</div>

<QuickSearch />