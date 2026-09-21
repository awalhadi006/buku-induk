<script lang="ts">
	import { IconCheck, IconEye, IconEyeOff } from '@tabler/icons-svelte';
	import LoadingButton from '$lib/components/LoadingButton.svelte';

	let { form } = $props();
	let show = $state(false);
	let submitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		submitting = true;
		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const res = await fetch('?/submit', {
			method: 'POST',
			body: formData
		});
		const data = await res.json() as { type?: string; location?: string };
		if (res.ok && data.type === 'redirect') {
			window.location.href = data.location ?? '/';
		} else {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Masuk | Buku Induk</title>
	<!-- Proksi sama dengan halaman app: logo sekolah bila sudah diatur, fallback svg bila belum -->
	<link rel="icon" href="/api/favicon" />
</svelte:head>

<!-- Skip link: first focusable element -->
<a
	href="#login-form"
	class="btn btn-primary btn-sm fixed left-4 top-4 z-50 -translate-y-20 focus-visible:translate-y-0 motion-reduce:transition-none">
	Lewati ke formulir
</a>

<div class="flex min-h-[100dvh] items-center justify-center bg-base-100 text-base-content px-4 py-12">
	<div class="w-full max-w-sm">
		<!-- Card container using daisyUI card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<!-- Mobile logo -->
				<div class="mb-6 flex items-center gap-3 lg:hidden">
					<span
						class="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-xl font-bold text-primary">
						BI</span
					>
					<span class="text-lg font-semibold tracking-tight">Buku Induk</span>
				</div>

				<h1 class="text-2xl font-semibold tracking-tight text-center">Masuk</h1>
				<p class="mt-1 text-center text-base-content/70">
					Masuk dengan akun pondok yang dibuat bagian tata usaha.
				</p>

				<form
					id="login-form"
					method="POST"
					class="mt-8 space-y-5"
					action="?/submit"
					onsubmit={handleSubmit}>

					<div>
						<label for="username" class="label">
							<span class="label-text">Username atau Email</span>
						</label>
						<input
							id="username"
							name="username"
							type="text"
							required
							autocomplete="username"
							class="input input-bordered w-full"
							placeholder="username atau email" />
					</div>

					<div>
						<label for="password" class="label">
							<span class="label-text">Kata sandi</span>
						</label>
						<div class="relative">
							<input
								id="password"
								name="password"
								type={show ? 'text' : 'password'}
								required
								autocomplete="current-password"
								class="input input-bordered w-full pr-11"
								placeholder="••••••••" />
							<button
								type="button"
								class="btn btn-ghost btn-square btn-sm absolute inset-y-0 right-0"
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

					{#if form?.error}
						<div class="alert alert-error" role="alert">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="stroke-current shrink-0 h-6 w-6"
								fill="none"
								viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span>{form.error}</span>
						</div>
					{/if}

					<LoadingButton loading={submitting} class="w-full">Masuk</LoadingButton>
				</form>

				<p class="mt-8 text-center text-sm text-base-content/60">
					Belum punya akun? Hubungi bagian tata usaha pondok.
				</p>
			</div>
		</div>

		<!-- Footer with theme controller -->
		<footer class="mt-8 flex items-center justify-center gap-4 text-sm text-base-content/60">
			<p>Buku Induk Santri</p>
			<!-- daisyUI theme-controller -->
			<div class="theme-controller" data-themes="bi-light,bi-dark">
				<button class="btn btn-ghost btn-square btn-sm" aria-label="Pilih tema">
					<svg
						class="size-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						aria-hidden="true">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
					</svg>
				</button>
			</div>
		</footer>
	</div>
</div>