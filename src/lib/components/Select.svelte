<script lang="ts">
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
		onChange
	}: {
		name: string;
		value?: string;
		options: Option[];
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		onChange?: (value: string) => void;
	} = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		value = target.value;
		onChange?.(target.value);
	}
</script>

<div class="{className}">
	<label class="label" for={name}>
		<span class="label-text">{placeholder}</span>
	</label>
	<select
		id={name}
		name={name}
		bind:value={value}
		class="select select-bordered w-full {className}"
		required={required}
		disabled={disabled}
		onchange={handleChange}>
		<option value="" disabled selected>{placeholder}</option>
		{#each options as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
</div>