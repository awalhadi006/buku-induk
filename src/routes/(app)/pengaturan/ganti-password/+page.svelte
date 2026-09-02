<script lang="ts">
	import { IconPassword } from '@tabler/icons-svelte';

	let { form } = $props();

	let password = $state('');
	let passwordConfirm = $state('');
	let submitting = $state(false);

	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
	const actionSuccess = $derived(form && !(form as { error?: string }).error);

	function resetForm() {
		password = '';
		passwordConfirm = '';
	}

	// Clear form on successful submission
	$effect(() => {
		if (actionSuccess) {
			resetForm();
		}
	});
</script>

<svelte:head>
	<title>Ganti Kata Sandi | Pengaturan | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Ganti Kata Sandi</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Ubah kata sandi akun Anda. Anda akan keluar secara otomatis setelah mengganti kata sandi.
	</p>
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{:else if actionSuccess}
	<div class="alert alert-success mt-6" role="alert">
		<span>Kata sandi berhasil diubah. Anda akan diarahkan ke halaman login.</span>
	</div>
{/if}

<form method="POST" action="?/changePassword" class="mt-6 max-w-lg rounded-lg border border-base-300 bg-base-100 p-5">
	<h2 class="flex items-center gap-2 text-sm font-semibold">
		<IconPassword class="size-4" stroke-width={1.75} />
		Form Ganti Kata Sandi
	</h2>

	<div class="mt-4 space-y-4">
		<label class="block">
			<span class="mb-1.5 block text-sm font-medium">Kata sandi baru</span>
			<input
				type="password"
				name="password"
				placeholder="Masukkan kata sandi baru"
				class="input input-bordered w-full"
				required
				bind:value={password}
				autocomplete="new-password" />
		</label>

		<label class="block">
			<span class="mb-1.5 block text-sm font-medium">Konfirmasi kata sandi baru</span>
			<input
				type="password"
				name="passwordConfirm"
				placeholder="Ulangi kata sandi baru"
				class="input input-bordered w-full"
				required
				bind:value={passwordConfirm}
				autocomplete="new-password" />
		</label>

		<div class="flex justify-end gap-2">
			<button type="button" class="btn btn-ghost" onclick={resetForm}>Reset</button>
			<button type="submit" class="btn btn-primary" disabled={submitting || !password || password !== passwordConfirm} onclick={() => submitting = true}>
				{#if submitting}<span class="loading loading-spinner loading-sm"></span>{/if}
				Ganti Kata Sandi
			</button>
		</div>
	</div>
</form>
