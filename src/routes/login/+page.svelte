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
		const res = await fetch('?/default', {
			method: 'POST',
			body: formData
		});
		const data = await res.json();
		if (res.ok && data.type === 'redirect') {
			window.location.href = data.location;
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

<div class="grid min-h-[100dvh] bg-base-100 text-base-content lg:grid-cols-[1.15fr_1fr]">
	<aside class="hidden flex-col justify-between bg-emerald-950 p-10 text-emerald-50 lg:flex lg:p-14">
		<div class="flex items-center gap-3">
			<span
				class="flex size-9 items-center justify-center rounded-xl bg-emerald-400/15 text-xl font-bold text-emerald-300"
				>BI</span
			>
			<span class="text-lg font-semibold tracking-tight">Buku Induk</span>
		</div>

		<div>
			<h1 class="max-w-md text-4xl font-semibold leading-tight tracking-tight">
				Arsip data santri,<br />satu tempat yang bisa dicek.
			</h1>
			<p class="mt-4 max-w-md text-emerald-100/80">
				Buku induk digital pondok: data santri dan wali, riwayat perubahan, rekap kapan pun berada.
			</p>
		</div>

		<ul class="space-y-3 text-sm text-emerald-100/90">
			<li class="flex items-center gap-2">
				<IconCheck class="size-4 text-emerald-300" stroke-width={2} />
				Data santri dan wali tercatat rapi
			</li>
			<li class="flex items-center gap-2">
				<IconCheck class="size-4 text-emerald-300" stroke-width={2} />
				Setiap perubahan terekam otomatis
			</li>
			<li class="flex items-center gap-2">
				<IconCheck class="size-4 text-emerald-300" stroke-width={2} />
				Rekap bisa dilihat dari perangkat mana pun
			</li>
		</ul>
	</aside>

	<main class="flex items-center justify-center px-6 py-12">
		<div class="w-full max-w-sm">
			<div class="mb-8 flex items-center gap-3 lg:hidden">
				<span
					class="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-xl font-bold text-primary"
					>BI</span
				>
				<span class="text-lg font-semibold tracking-tight">Buku Induk</span>
			</div>

			<h1 class="text-2xl font-semibold tracking-tight">Masuk</h1>
			<p class="mt-1 text-base-content/70">
				Masuk dengan akun pondok yang dibuat bagian tata usaha.
			</p>

			<form method="POST" class="mt-8 space-y-5" onsubmit={handleSubmit}>
				<div>
				<label for="username" class="mb-1.5 block text-sm font-medium">Username atau Email</label>
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
					<label for="password" class="mb-1.5 block text-sm font-medium">Kata sandi</label>
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
					<p class="text-sm text-error" role="alert">{form.error}</p>
				{/if}

				<LoadingButton loading={submitting} class="w-full">Masuk</LoadingButton>
			</form>

			<p class="mt-8 text-sm text-base-content/60">
				Belum punya akun? Hubungi bagian tata usaha pondok.
			</p>
		</div>
	</main>
</div>
