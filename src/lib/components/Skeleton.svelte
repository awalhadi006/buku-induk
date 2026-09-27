<script lang="ts">
	// ============================================
	// Base Skeleton (backward compatible default export)
	// ============================================
	type Variant = 'text' | 'card' | 'table' | 'stat';

	let {
		variant = 'text',
		rows = 1,
		cols = 3,
		count = 1,
		class: className = '',
		ariaLabel = 'Memuat konten...'
	}: {
		variant?: Variant;
		rows?: number;
		cols?: number;
		count?: number;
		class?: string;
		ariaLabel?: string;
	} = $props();
</script>

<!-- Base Skeleton (default export) -->
<div
	role="status"
	aria-busy="true"
	aria-label={ariaLabel}
	class="space-y-3 {className}">
	{#each Array(count) as _, i (i)}
		{#if variant === 'text'}
			<div class="space-y-2">
				{#each Array(rows) as _, r (r)}
					<div class="skeleton skeleton-text h-4 w-full animate-pulse"></div>
				{/each}
			</div>
		{:else if variant === 'card'}
			<div class="skeleton h-32 w-full rounded-lg animate-pulse"></div>
		{:else if variant === 'table'}
			<div class="space-y-2">
				{#each Array(rows) as _, r (r)}
					<div class="grid gap-4" style="grid-template-columns: repeat({cols}, 1fr);">
						{#each Array(cols) as _, c (c)}
							<div class="skeleton h-10 w-full animate-pulse"></div>
						{/each}
					</div>
				{/each}
			</div>
		{:else if variant === 'stat'}
			<div class="skeleton h-16 w-full rounded-lg animate-pulse"></div>
		{/if}
	{/each}
</div>

<script lang="ts" context="module">
	// ============================================
	// Named Export: StatCardSkeleton
	// Matches stats grid card: h-24 card with 3 skeleton lines
	// (label, value, optional description)
	// ============================================
	export function StatCardSkeleton({ class: className = '', ariaLabel = 'Memuat kartu statistik...' }: { class?: string; ariaLabel?: string } = {}) {
		return {
			'$$render': () => `
<div role="status" aria-busy="true" aria-label="${ariaLabel}" class="card card-border bg-base-100 p-5 h-24 ${className}">
  <div class="skeleton skeleton-text h-4 w-3/4 animate-pulse mb-2"></div>
  <div class="skeleton skeleton-text h-10 w-1/2 animate-pulse font-mono"></div>
  <div class="skeleton skeleton-text h-3 w-1/3 animate-pulse mt-2"></div>
</div>`
		};
	}

	// ============================================
	// Named Export: BarListSkeleton
	// 5 bar rows with label skeleton + bar skeleton (h-3 rounded)
	// ============================================
	export function BarListSkeleton({ count = 5, class: className = '', ariaLabel = 'Memuat diagram batang...' }: { count?: number; class?: string; ariaLabel?: string } = {}) {
		const rows = Array.from({ length: count }, (_, i) => `
  <div class="flex items-center gap-3 py-1.5">
    <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
    <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
      <div class="skeleton h-full w-1/2 rounded-full animate-pulse"></div>
    </div>
  </div>`).join('');

		return {
			'$$render': () => `
<div role="status" aria-busy="true" aria-label="${ariaLabel}" class="space-y-1 ${className}">
${rows}
</div>`
		};
	}

	// ============================================
	// Named Export: TableSkeleton
	// thead skeleton + 5 tbody row skeletons
	// ============================================
	export function TableSkeleton({
		cols = 2,
		rows = 5,
		class: className = '',
		ariaLabel = 'Memuat tabel...'
	}: { cols?: number; rows?: number; class?: string; ariaLabel?: string } = {}) {
		const theadCells = Array.from({ length: cols }, () =>
			'<th class="skeleton skeleton-text h-4 w-full animate-pulse px-5 py-3"></th>'
		).join('');

		const tbodyRows = Array.from({ length: rows }, () => {
			const cells = Array.from({ length: cols }, () =>
				'<td class="skeleton skeleton-text h-4 w-full animate-pulse px-5 py-3"></td>'
			).join('');
			return `<tr>${cells}</tr>`;
		}).join('');

		return {
			'$$render': () => `
<div role="status" aria-busy="true" aria-label="${ariaLabel}" class="overflow-x-auto rounded-lg border border-base-300 bg-base-100 ${className}">
  <div class="skeleton h-8 w-full animate-pulse border-b border-base-200 px-5"></div>
  <table class="table">
    <thead>
      <tr class="text-xs uppercase tracking-wide text-base-content/60">${theadCells}</tr>
    </thead>
    <tbody>${tbodyRows}</tbody>
  </table>
</div>`
		};
	}

	// ============================================
	// Named Export: PageSkeleton
	// Composes StatCardSkeleton×4 + BarListSkeleton×2 for main dashboard
	// ============================================
	export function PageSkeleton({ class: className = '', ariaLabel = 'Memuat halaman dashboard...' }: { class?: string; ariaLabel?: string } = {}) {
		return {
			'$$render': () => `
<div role="status" aria-busy="true" aria-label="${ariaLabel}" class="mt-6 space-y-6 ${className}">
  <!-- Stats Grid: 4 cards (2 large + 2 small) -->
  <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Angka utama">
    <div class="card card-border bg-base-100 p-5 lg:col-span-2">
      <div class="skeleton skeleton-text h-4 w-3/4 animate-pulse mb-2"></div>
      <div class="skeleton skeleton-text h-10 w-1/2 animate-pulse font-mono"></div>
      <div class="skeleton skeleton-text h-3 w-1/3 animate-pulse mt-2"></div>
    </div>
    <div class="card card-border bg-base-100 p-5">
      <div class="skeleton skeleton-text h-4 w-3/4 animate-pulse mb-2"></div>
      <div class="skeleton skeleton-text h-8 w-1/2 animate-pulse font-mono"></div>
    </div>
    <div class="card card-border bg-base-100 p-5">
      <div class="skeleton skeleton-text h-4 w-3/4 animate-pulse mb-2"></div>
      <div class="skeleton skeleton-text h-8 w-1/2 animate-pulse font-mono"></div>
    </div>
  </section>

  <!-- Comparison Section: 2 BarList skeletons -->
  <section class="grid gap-4 lg:grid-cols-2" aria-label="Perbandingan">
    <div class="card card-border bg-base-100 p-5">
      <div class="skeleton skeleton-text h-4 w-1/3 animate-pulse mb-2"></div>
      <div class="space-y-1">
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-1/2 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-2/3 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-1/3 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-3/4 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-1/4 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="card card-border bg-base-100 p-5">
      <div class="skeleton skeleton-text h-4 w-1/3 animate-pulse mb-2"></div>
      <div class="space-y-1">
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-1/2 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-2/3 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-1/3 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-3/4 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 py-1.5">
          <div class="skeleton skeleton-text w-32 h-4 animate-pulse"></div>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative">
            <div class="skeleton h-full w-1/4 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`
		};
	}
</script>