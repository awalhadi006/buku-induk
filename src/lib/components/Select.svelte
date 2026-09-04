<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Option {
		value: string;
		label: string;
	}

	let {
		name,
		value = $bindable(''),
		options = [],
		placeholder = '— Pilih —',
		required = false,
		disabled = false,
		class: className = '',
		maxHeight = '200px',
		onChange
	}: {
		name: string;
		value?: string;
		options: Option[];
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		maxHeight?: string;
		onChange?: (value: string) => void;
	} = $props();

	let isOpen = $state(false);
	let selectedOption = $derived(options.find((o) => o.value === value)?.label ?? placeholder);
	let dropdownRef = $state<HTMLDivElement>();
	let buttonRef: HTMLButtonElement;

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && buttonRef) {
			if (!dropdownRef.contains(event.target as Node) && !buttonRef.contains(event.target as Node)) {
				isOpen = false;
			}
		}
	}

	function selectOption(option: Option) {
		value = option.value;
		selectedOption = option.label;
		isOpen = false;
		onChange?.(option.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			isOpen = !isOpen;
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!isOpen) isOpen = true;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (!isOpen) isOpen = true;
		}
	}

	function handleOptionKeydown(event: KeyboardEvent, option: Option) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectOption(option);
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="relative {className}">
	<button
		type="button"
		bind:this={buttonRef}
		class="select select-bordered w-full text-left justify-start px-3 py-2"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-labelledby={name}
		disabled={disabled}
		onclick={() => !disabled && (isOpen = !isOpen)}
		onkeydown={handleKeydown}>
		<span class="truncate">{selectedOption}</span>
		<svg class="size-4 ms-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
		<input type="hidden" name={name} value={value} required={required} />
	</button>

	{#if isOpen && !disabled}
		<div
			bind:this={dropdownRef}
			class="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-base-300 bg-base-100 shadow-lg overflow-hidden"
			style="max-height: {maxHeight}; overflow-y: auto;"
			role="listbox"
			aria-label={placeholder}>
			<div
				class="py-1"
				role="option"
				tabindex="0"
				aria-selected={value === ''}
				onclick={() => selectOption({ value: '', label: placeholder })}
				onkeydown={(e) => handleOptionKeydown(e, { value: '', label: placeholder })}>
				<span class="px-3 py-2 text-base-content/60">{placeholder}</span>
			</div>
			{#each options as opt (opt.value)}
				<div
					class="px-3 py-2 hover:bg-base-200 cursor-pointer"
					role="option"
					tabindex="0"
					aria-selected={value === opt.value}
					onclick={() => selectOption(opt)}
					onkeydown={(e) => handleOptionKeydown(e, opt)}>
					{opt.label}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	:global(.select) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-base-300);
		background-color: var(--color-base-100);
		color: var(--color-base-content);
		transition: color 0.15s, background-color 0.15s, border-color 0.15s;
	}

	:global(.select:focus) {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary), 0 0 0 4px var(--color-base-100);
	}

	:global(.select:disabled) {
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.select-bordered) {
		border-color: var(--color-base-300);
	}
</style>