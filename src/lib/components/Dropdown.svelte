<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';

	type DropdownItem = {
		label: string;
		value?: string;
		icon?: import('svelte').Snippet;
		disabled?: boolean;
		divider?: boolean;
		danger?: boolean;
	};

	type DropdownTriggerProps = {
		children: import('svelte').Snippet;
	};

	type DropdownEvents = {
		select: { value: string | undefined; label: string };
	};

	let {
		items = [],
		trigger,
		align = 'end',
		closeOnClick = true
	}: {
		items: DropdownItem[];
		trigger: import('svelte').Snippet<[DropdownTriggerProps]>;
		align?: 'start' | 'end';
		closeOnClick?: boolean;
	} = $props();

	const dispatch = createEventDispatcher<DropdownEvents>();
	let open = $state(false);
	let dropdownRef = $state<HTMLDivElement | null>(null);
	let triggerButtonRef = $state<HTMLButtonElement | null>(null);
	let menuRef = $state<HTMLUListElement | null>(null);
	let focusedIndex = $state(-1);

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			closeDropdown();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open) {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
				event.preventDefault();
				openDropdown();
			}
			return;
		}

		const menuItems = getMenuItems();
		if (menuItems.length === 0) return;

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				closeDropdown();
				triggerButtonRef?.focus();
				break;
			case 'ArrowDown':
				event.preventDefault();
				focusedIndex = (focusedIndex + 1) % menuItems.length;
				menuItems[focusedIndex]?.focus();
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedIndex = (focusedIndex - 1 + menuItems.length) % menuItems.length;
				menuItems[focusedIndex]?.focus();
				break;
			case 'Home':
				event.preventDefault();
				focusedIndex = 0;
				menuItems[0]?.focus();
				break;
			case 'End':
				event.preventDefault();
				focusedIndex = menuItems.length - 1;
				menuItems[focusedIndex]?.focus();
				break;
			case 'Tab':
				event.preventDefault();
				closeDropdown();
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
					const item = items[focusedIndex];
					if (!item.disabled && !item.divider) {
						selectItem(item);
					}
				}
				break;
		}
	}

	function getMenuItems(): HTMLButtonElement[] {
		if (!menuRef) return [];
		return Array.from(menuRef.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])'));
	}

	function selectItem(item: DropdownItem) {
		if (item.disabled || item.divider) return;
		dispatch('select', { value: item.value, label: item.label });
		if (closeOnClick) closeDropdown();
	}

	function closeDropdown() {
		if (open) {
			open = false;
			focusedIndex = -1;
		}
	}

	function openDropdown() {
		if (!open) {
			open = true;
			focusedIndex = -1;
			// Focus first menu item after render
			setTimeout(() => {
				const menuItems = getMenuItems();
				if (menuItems.length > 0) {
					focusedIndex = 0;
					menuItems[0]?.focus();
				}
			}, 0);
		}
	}

	function handleTriggerClick() {
		if (open) {
			closeDropdown();
		} else {
			openDropdown();
		}
	}

	$effect(() => {
		if (open) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="dropdown dropdown-end" bind:this={dropdownRef}>
	<button
		type="button"
		class="btn btn-ghost btn-sm"
		bind:this={triggerButtonRef}
		aria-haspopup="true"
		aria-expanded={open}
		aria-label="Buka menu"
		onclick={handleTriggerClick}>
		{@render trigger({ children: () => `\xA0` })}
	</button>
	{#if open}
		<ul
			class="dropdown-content menu menu-sm p-2 shadow bg-base-100 rounded-box w-52"
			role="menu"
			bind:this={menuRef}>
			{#each items as item, index (item.value ?? item.label)}
				{#if item.divider}
					<li role="separator"><hr class="border-base-200" /></li>
				{:else}
					<li>
						<button
							type="button"
							class="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm {item.disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-base-200'} {item.danger ? 'text-error' : 'text-base-content'}"
							role="menuitem"
							aria-disabled={item.disabled}
							disabled={item.disabled}
							onclick={() => selectItem(item)}
							onfocus={() => (focusedIndex = index)}>
							{#if item.icon}
								{@render item.icon()}
							{/if}
							<span>{item.label}</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}
</div>