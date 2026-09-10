<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import LoadingButton from './LoadingButton.svelte';

	let {
		error,
		submitting = false,
		submitLabel,
		cancelHref,
		action,
		onSubmit,
		extra,
		children
	}: {
		error?: string | null;
		submitting?: boolean;
		submitLabel: string;
		cancelHref: string;
		action?: string;
		onSubmit?: (el: HTMLFormElement) => void;
		extra?: Snippet;
		children: Snippet;
	} = $props();

	const busy = $derived(submitting ?? false);
	const formError = $derived(error ?? ((page.form as { error?: string } | null)?.error ?? null));

	async function handleSubmit(e: SubmitEvent) {
		if (onSubmit) {
			e.preventDefault();
			await onSubmit(e.currentTarget as HTMLFormElement);
		}
	}
</script>

{#if formError}
	<div class="alert alert-error mb-6 animate-in" role="alert">
		<span>{formError}</span>
	</div>
{/if}

<form
	method="POST"
	action={onSubmit ? undefined : action}
	onsubmit={handleSubmit}
	enctype="multipart/form-data"
	class="space-y-6">
	{@render children()}

	{#if extra}
		{@render extra()}
	{/if}

	<div class="flex items-center gap-3 mt-6">
		<LoadingButton type="submit" loading={busy}>
			{submitLabel}
		</LoadingButton>
		<a class="btn btn-ghost" href={cancelHref}>Batal</a>
	</div>
</form>
