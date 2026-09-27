<script lang="ts">
	import { onDestroy } from 'svelte';

	let {
		open = $bindable(false),
		title,
		description,
		children,
		size = 'md',
		closeOnBackdrop = true,
		closeOnEscape = true
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		children: import('svelte').Snippet;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		closeOnBackdrop?: boolean;
		closeOnEscape?: boolean;
	} = $props();

	const sizeClasses: Record<string, string> = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		full: 'max-w-4xl'
	};

	let modalRef = $state<HTMLDivElement | null>(null);
	let triggerRef = $state<HTMLElement | null>(null);

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) {
			closeModal();
		} else if (event.key === 'Tab' && open) {
			trapFocus(event);
		}
	}

	function trapFocus(event: KeyboardEvent) {
		if (!modalRef) return;

		const focusableElements = modalRef.querySelectorAll<HTMLElement>(
			'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);

		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey) {
			if (document.activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			}
		} else {
			if (document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}
	}

	function closeModal() {
		open = false;
		// Restore focus to trigger element
		if (triggerRef) {
			triggerRef.focus();
		}
	}

	function handleOpenChange() {
		if (open) {
			// Store the trigger element (the element that had focus before modal opened)
			triggerRef = document.activeElement as HTMLElement;
		}
	}

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
			// Focus first focusable element in modal after render
			setTimeout(() => {
				if (modalRef) {
					const focusable = modalRef.querySelector<HTMLElement>(
						'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
					);
					focusable?.focus();
				}
			}, 0);
		} else {
			document.body.style.overflow = '';
			// Focus restoration handled in closeModal
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	$effect(() => {
		handleOpenChange();
	});

	$effect(() => {
		if (open) {
			document.addEventListener('keydown', handleKeydown);
			return () => {
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
</script>

{#if open}
	<div class="modal modal-open" tabindex="-1" role="dialog" aria-modal="true" bind:this={modalRef}>
		<div class="modal-box {sizeClasses[size]}">
			{#if title || description}
				<div class="mb-4">
					{#if title}
						<h3 class="font-semibold text-lg">{title}</h3>
					{/if}
					{#if description}
						<p class="mt-1 text-sm text-base-content/70">{description}</p>
					{/if}
				</div>
			{/if}
			{@render children()}
		</div>
		<div class="modal-backdrop" role="button" tabindex="-1" onclick={handleBackdropClick} onkeydown={(e) => e.key === 'Escape' && handleBackdropClick(e as unknown as MouseEvent)}>
			<button class="btn btn-sm btn-ghost" onclick={closeModal}>Tutup</button>
		</div>
	</div>
{/if}