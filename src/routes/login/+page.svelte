<script lang="ts">
	import { IconCheck, IconEye, IconEyeOff, IconMail, IconLock, IconMoon, IconShield, IconSun } from '@tabler/icons-svelte';
	import LoadingButton from '$lib/components/LoadingButton.svelte';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { photoUrl } from '$lib/gdrive-url';

	let { form, schoolName, schoolLogoUrl } = $props();
	let show = $state(false);
	let submitting = $state(false);
	let dark = $state(false);

	const logoUrl = $derived(photoUrl(schoolLogoUrl) ?? '/placeholder-santri.jpg');
	const displayName = $derived(schoolName ?? 'Buku Induk');

	onMount(() => {
		const attr = document.documentElement.getAttribute('data-theme');
		dark = attr === 'bi-dark' || (attr === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
	});

	function setDark(value: boolean) {
		dark = value;
		document.documentElement.setAttribute('data-theme', value ? 'bi-dark' : 'bi-light');
		localStorage.setItem('theme', value ? 'bi-dark' : 'bi-light');
	}

	function toggleTheme() {
		setDark(!dark);
	}
</script>

<svelte:head>
	<title>Masuk | Buku Induk</title>
	<link rel="icon" href="/api/favicon" />
</svelte:head>

<!-- Skip link: first focusable element -->
<a
	href="#login-form"
	class="btn btn-primary btn-sm fixed left-4 top-4 z-50 -translate-y-20 focus-visible:translate-y-0 motion-reduce:transition-none">
	Lewati ke formulir
</a>

<!-- Animasi entrance untuk card -->
<style>
	.login-card {
		opacity: 0;
		transform: translateY(20px);
		animation: login-card-in var(--duration-panel) var(--ease-out) forwards;
	}

	@keyframes login-card-in {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.login-card {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}

	/* Animasi sidebar ilustrasi */
	.login-sidebar {
		opacity: 0;
		transform: translateX(40px);
		animation: sidebar-in var(--duration-panel) var(--ease-out) forwards;
		animation-delay: 100ms;
	}

	@keyframes sidebar-in {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.login-sidebar {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}

	/* Focus visible untuk input */
	.input:focus-visible,
	.input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		box-shadow: 0 0 0 3px var(--color-primary-content);
	}
</style>

<div class="flex min-h-[100dvh] bg-base-100 text-base-content lg:grid lg:grid-cols-[1.15fr_1fr]">
	<!-- Sidebar ilustrasi - Desktop only -->
	<aside class="login-sidebar hidden lg:flex lg:flex-col justify-between bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-10 lg:p-14">
		<div class="flex items-center gap-3">
			<img
				src={logoUrl}
				alt=""
				class="size-9 rounded-xl object-cover"
				aria-hidden="true"
			/>
			<span class="text-lg font-semibold tracking-tight">{displayName}</span>
		</div>

		<div>
			<h1 class="max-w-md text-4xl font-semibold leading-tight tracking-tight">
				Arsip data santri,<br />satu tempat yang bisa dicek.
			</h1>
			<p class="mt-4 max-w-md text-base-content/80">
				Buku induk digital pondok: data santri dan wali, riwayat perubahan, rekap kapan pun berada.
			</p>
		</div>

		<ul class="space-y-3 text-sm text-base-content/90" role="list" aria-label="Fitur utama">
			<li class="flex items-center gap-2">
				<IconShield class="size-4 text-primary" stroke-width={2} aria-hidden="true" />
				Data santri dan wali tercatat rapi
			</li>
			<li class="flex items-center gap-2">
				<IconCheck class="size-4 text-primary" stroke-width={2} aria-hidden="true" />
				Setiap perubahan terekam otomatis
			</li>
			<li class="flex items-center gap-2">
				<IconCheck class="size-4 text-primary" stroke-width={2} aria-hidden="true" />
				Rekap bisa dilihat dari perangkat mana pun
			</li>
		</ul>
	</aside>

	<main class="flex items-center justify-center px-6 py-12">
		<div class="w-full max-w-sm">
			<!-- Mobile logo -->
			<div class="mb-6 flex items-center gap-3 lg:hidden">
				<img
					src={logoUrl}
					alt=""
					class="size-9 rounded-xl object-cover"
					aria-hidden="true"
				/>
				<span class="text-lg font-semibold tracking-tight">{displayName}</span>
			</div>

			<!-- Card form dengan animasi entrance -->
			<div id="login-form" class="login-card card bg-base-100 shadow-xl border border-base-200">
				<div class="card-body p-8">
					<h1 class="text-2xl font-semibold tracking-tight text-center">Masuk</h1>
					<p class="mt-1 text-center text-base-content/70">
						Masuk dengan akun pondok yang dibuat bagian tata usaha.
					</p>

					<form
						id="login-form-inner"
						method="POST"
						class="mt-8 space-y-5"
						action="?/submit"
						use:enhance
						onsubmit={() => { submitting = true; }}>

						<!-- Username/Email Field -->
						<div class="form-control">
							<label for="username" class="label">
								<span class="label-text">Username atau Email</span>
							</label>
							<div class="relative">
								<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" aria-hidden="true">
									<IconMail class="size-5" />
								</span>
								<input
									id="username"
									name="username"
									type="text"
									required
									autocomplete="username"
									class="input input-bordered w-full pl-10"
									placeholder="username atau email" />
							</div>
						</div>

						<!-- Password Field -->
						<div class="form-control">
							<label for="password" class="label">
								<span class="label-text">Kata sandi</span>
							</label>
							<div class="relative">
								<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" aria-hidden="true">
									<IconLock class="size-5" />
								</span>
								<input
									id="password"
									name="password"
									type={show ? 'text' : 'password'}
									required
									autocomplete="current-password"
									class="input input-bordered w-full pl-10 pr-11"
									placeholder="••••••••" />
								<button
									type="button"
									class="btn btn-ghost btn-square btn-xs absolute right-2 top-1/2 -translate-y-1/2"
									aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
									onclick={() => (show = !show)}>
									{#if show}
										<IconEyeOff class="size-4" stroke-width={1.75} />
									{:else}
										<IconEye class="size-4" stroke-width={1.75} />
									{/if}
								</button>
							</div>
						</div>

						<!-- Error Alert -->
						{#if form?.error}
							<div class="alert alert-error alert-soft" role="alert">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="stroke-current shrink-0 h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span>{form.error}</span>
							</div>
						{/if}

						<!-- Submit Button -->
						<LoadingButton loading={submitting} class="w-full">Masuk</LoadingButton>
					</form>

					<!-- Footer note -->
					<p class="mt-8 text-center text-sm text-base-content/60">
						Belum punya akun? Hubungi bagian tata usaha pondok.
					</p>
				</div>
			</div>

			<!-- Footer dengan theme toggle -->
			<footer class="mt-8 flex flex-col items-center justify-center gap-4 text-sm text-base-content/60 lg:flex-row">
				<p>{displayName}</p>
				<button
					class="btn btn-ghost btn-square btn-sm"
					aria-label={dark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
					onclick={toggleTheme}>
					{#if dark}
						<IconSun class="size-5" stroke-width={2} />
					{:else}
						<IconMoon class="size-5" stroke-width={2} />
					{/if}
				</button>
			</footer>
		</div>
	</main>
</div>