# Component Library Documentation

This document provides a comprehensive reference for all UI components in `src/lib/components/`. All components have been migrated to use **daisyUI 5** primitives with semantic design tokens from `layout.css`.

---

## Component Index

| Component | Purpose | daisyUI Classes | Key Props |
|-----------|---------|-----------------|-----------|
| [PageHeader](#pageheader) | Page title + actions | `card`, `card-body`, `card-border` | `title`, `desc`, `backHref`, `actions` snippet |
| [EmptyState](#emptystate) | Empty/no-data states | `alert`, `alert-soft`, `alert-info` | `title`, `desc`, `children` snippet |
| [BarList](#barlist) | Horizontal bar charts | `bg-base-200`, `bg-primary` (custom SVG) | `rows`, `max` |
| [LoadingState](#loadingstate) | Async loading wrapper | `skeleton`, `skeleton-text` | `data` (Snippet), `fallback` |
| [LoadingButton](#loadingbutton) | Button with loading state | `btn`, `loading`, `loading-spinner` | `loading`, `children` |
| [FormShell](#formshell) | Form container wrapper | `card`, `card-body` | `title`, `desc`, `children` snippet |
| [Select](#select) | Native select wrapper | `select`, `select-bordered`, `label` | `name`, `value`, `options`, `placeholder` |
| [Skeleton](#skeleton) | Loading placeholders | `skeleton`, `skeleton-text` | `variant`, `rows`, `cols`, `count` |
| [QuickSearch](#quicksearch) | Global search modal | `modal`, `modal-box`, `input`, `dropdown` | (self-contained, triggered via event) |
| [WaliForm](#waliform) | Wali santri form | `fieldset`, `input`, `select`, `textarea` | `values`, `kamar`, `kelas`, `wali`, `action` |
| [SantriForm](#santriform) | Santri form | `fieldset`, `input`, `select`, `textarea` | `values`, `kamar`, `kelas`, `wali`, `gdrive` |
| [Collapse](#collapse) | Accordion/collapse | `collapse`, `collapse-arrow` | `open` (bindable), `duration`, `children` |

---

## PageHeader

### Purpose
Page header with title, description, optional back link, and action buttons.

### daisyUI Classes
```svelte
<div class="card card-border sm:card-side">
  <div class="card-body">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- content -->
    </div>
  </div>
</div>
```

### Props
```typescript
interface PageHeaderProps {
  title: string;
  desc?: string;
  backHref?: string;
  actions?: Snippet;
}
```

### Example
```svelte
<PageHeader title="Santri" desc="Daftar santri pesantren">
  {#snippet actions()}
    <a class="btn btn-primary" href="/santri/baru">Tambah</a>
  {/snippet}
</PageHeader>
```

### Migration
| Before | After |
|--------|-------|
| Custom `header` with `flex` + custom classes | `card card-border sm:card-side` with `card-body` |
| Custom back button | `btn btn-ghost btn-square btn-sm` |

---

## EmptyState

### Purpose
Consistent empty/no-data state with icon, message, and actions.

### daisyUI Classes
```svelte
<div class="alert alert-soft alert-info" role="status">
  <svg class="stroke-current shrink-0 h-6 w-6" ... />
  <div>
    <h3 class="font-bold">{title}</h3>
    <div class="text-xs">{desc}</div>
  </div>
  <div class="flex flex-wrap gap-2 mt-4">{@render children()}</div>
</div>
```

### Props
```typescript
interface EmptyStateProps {
  title: string;
  desc?: string;
  children?: Snippet;
}
```

### Example
```svelte
<EmptyState title="Belum ada data" desc="Tambahkan data baru">
  <a class="btn btn-primary btn-sm" href="/import">Import</a>
</EmptyState>
```

### Migration
| Before | After |
|--------|-------|
| Custom `rounded-lg border-dashed bg-base-200/40` | `alert alert-soft alert-info` with SVG icon |
| `empty-state animate-in` CSS class | Built-in alert animation via `@starting-style` |

---

## BarList

### Purpose
Horizontal bar chart for dashboard statistics.

### daisyUI Classes
Uses semantic color tokens directly:
```svelte
<div class="h-2 flex-1 overflow-hidden rounded-full bg-base-200">
  <div class="bar-grow h-full rounded-full bg-primary" style="width: {...}%"></div>
</div>
```

### Props
```typescript
interface BarListProps {
  rows: { label: string; value: number }[];
  max: number;
}
```

### Note
**Not migrated** - keeps custom SVG bar animation. Uses daisyUI color tokens (`bg-base-200`, `bg-primary`).

---

## LoadingState

### Purpose
Wrapper for async content with skeleton loading fallback.

### daisyUI Classes
```svelte
{#await data}
  <div class="space-y-3">
    {#each Array(3) as _}
      <div class="skeleton skeleton-text h-4 w-3/4"></div>
      <div class="skeleton skeleton-text h-4 w-1/2"></div>
    {/each}
  </div>
{:then content}
  {@render content()}
{/await}
```

### Props
```typescript
interface LoadingStateProps {
  data: Promise<any>;
  fallback?: Snippet;
  children: Snippet<[any]>;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom `SkeletonTable` component | Inline daisyUI `skeleton` + `skeleton-text` |

---

## LoadingButton

### Purpose
Button with built-in loading spinner state.

### daisyUI Classes
```svelte
<button class="btn {loading ? 'loading' : ''} {@restProps()}">
  {loading ? <span class="loading-spinner" aria-hidden="true" /> : ''}
  {@render children()}
</button>
```

### Props
```typescript
interface LoadingButtonProps {
  loading?: boolean;
  children: Snippet;
  // ... rest of button props (class, disabled, type, etc.)
}
```

### Migration
| Before | After |
|--------|-------|
| Custom loading spinner SVG | daisyUI `loading` class + `loading-spinner` |

---

## FormShell

### Purpose
Consistent form container with optional title/description.

### daisyUI Classes
```svelte
<div class="card card-border bg-base-100">
  <div class="card-body">
    {#if title}
      <h2 class="card-title">{title}</h2>
    {/if}
    {#if desc}
      <p class="text-sm text-base-content/70">{desc}</p>
    {/if}
    <div class="mt-4">{@render children()}</div>
  </div>
</div>
```

### Props
```typescript
interface FormShellProps {
  title?: string;
  desc?: string;
  children: Snippet;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom wrapper div | `card card-border bg-base-100` with `card-body` |

---

## Select

### Purpose
Native `<select>` with daisyUI styling and label.

### daisyUI Classes
```svelte
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
    onchange={handleChange}
  >
    <option value="" disabled selected>{placeholder}</option>
    {#each options as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>
```

### Props
```typescript
interface SelectProps {
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
  onChange?: (value: string) => void;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom dropdown with absolute positioning | Native `<select>` with `select select-bordered` |

---

## Skeleton

### Purpose
Loading placeholder components (text, card, table, stat variants).

### daisyUI Classes
```svelte
<div class="space-y-3 {className}" role="status" aria-busy="true" aria-label={ariaLabel}>
  {#each Array(count) as _}
    {#if variant === 'text'}
      <div class="skeleton skeleton-text h-4 w-full"></div>
    {:else if variant === 'card'}
      <div class="skeleton h-32 w-full rounded-lg"></div>
    {:else if variant === 'table'}
      <div class="grid gap-4" style="grid-template-columns: repeat({cols}, 1fr);">
        {#each Array(cols) as _}
          <div class="skeleton h-10 w-full"></div>
        {/each}
      </div>
    {:else if variant === 'stat'}
      <div class="skeleton h-16 w-full rounded-lg"></div>
    {/if}
  {/each}
</div>
```

### Props
```typescript
interface SkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'stat';
  rows?: number;
  cols?: number;
  count?: number;
  class?: string;
  ariaLabel?: string;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom skeleton divs | daisyUI `skeleton` + `skeleton-text` |

---

## QuickSearch

### Purpose
Global search modal (Ctrl+K) with debounced Supabase search.

### daisyUI Classes
```svelte
<dialog class="modal modal-middle" id="quicksearch-modal">
  <div class="modal-box w-[min(560px,calc(100vw-2rem))] max-h-[90vh] overflow-hidden">
    <div class="flex items-center gap-2 border-b border-base-300 px-4 py-3">
      <input class="input input-bordered flex-1 bg-transparent text-sm" ... />
      <button class="btn btn-ghost btn-xs btn-square" ... />
    </div>
    <ul class="dropdown-content menu p-2 max-h-[60vh] overflow-y-auto" role="listbox">
      {#each results as res}
        <li role="option">
          <button class="btn btn-ghost btn-wide justify-start gap-3 rounded-xl px-3 py-2 text-left text-sm
            {selected ? 'btn-primary' : ''}" ... >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-base-200">
              <IconUsers /> or <IconBed /> or <IconSchool />
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
```

### Notes
- Self-contained component triggered via `window.dispatchEvent(new Event('quicksearch:open'))`
- Keyboard navigation: `Esc` to close, `ArrowUp/Down` to navigate, `Enter` to select
- Debounced search (300ms) against Supabase

---

## WaliForm

### Purpose
Form for creating/editing Wali Santri with fieldsets.

### daisyUI Classes
```svelte
<fieldset class="fieldset">
  <legend class="fieldset-legend">Data Ayah</legend>
  <label class="label">
    <span class="label-text">Nama ayah</span>
    <input name="nama_ayah" class="input input-bordered w-full" />
  </label>
  ...
</fieldset>

<fieldset class="fieldset">
  <legend class="fieldset-legend">Data Ibu</legend>
  ...
</fieldset>

<fieldset class="fieldset">
  <legend class="fieldset-legend">Wali & Kontak</legend>
  ...
</fieldset>
```

### Props
```typescript
interface WaliFormProps {
  values?: Record<string, string>;
  kamar?: { id: number; nomor: number }[];
  kelas?: { id: number; tingkat: string; rombel: string }[];
  wali?: { id: string; label: string }[];
  action: string;
  submitLabel?: string;
  cancelHref?: string;
  onSubmit?: (data) => void;
  error?: string;
  submitting?: boolean;
  extra?: Snippet;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom `div` groupings | Semantic `fieldset` + `fieldset-legend` |
| Custom input classes | `input input-bordered` |

---

## SantriForm

### Purpose
Comprehensive form for creating/editing Santri with fieldsets.

### daisyUI Classes
```svelte
<fieldset class="fieldset">
  <legend class="fieldset-legend">Identitas</legend>
  <label class="label">
    <span class="label-text">Nama lengkap</span>
    <input name="nama_lengkap" class="input input-bordered w-full" required />
  </label>
  <label class="label">
    <span class="label-text">Jenis kelamin</span>
    <select name="jenis_kelamin" class="select select-bordered w-full">
      {#each GENDER_OPTIONS as o}
        <option value={o.value}>{o.label}</option>
      {/each}
    </select>
  </label>
  ...
</fieldset>
```

### Props
```typescript
interface SantriFormProps {
  values?: Record<string, string>;
  kamar?: { id: number; nomor: number }[];
  kelas?: { id: number; tingkat: string; rombel: string }[];
  wali?: { id: string; label: string }[];
  gdrive?: boolean;
  customFields?: { nama: string; label: string; tipe: string; opsi: { value: string; label: string }[] }[];
  action: string;
  submitLabel?: string;
  cancelHref?: string;
  onSubmit?: (data) => void;
  error?: string;
  submitting?: boolean;
  extra?: Snippet;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom `div` groupings | Semantic `fieldset` + `fieldset-legend` |
| Custom input/select/textarea | `input input-bordered`, `select select-bordered`, `textarea textarea-bordered` |

---

## Collapse

### Purpose
Accordion/collapse component with smooth height animation.

### daisyUI Classes
```svelte
<div class="collapse collapse-arrow">
  <input type="checkbox" bind:checked={open} />
  <div class="collapse-content">{@render children()}</div>
</div>
```

### Props
```typescript
interface CollapseProps {
  open?: boolean; // bindable
  duration?: number; // kept for API compat (CSS handles timing)
  children: Snippet;
}
```

### Migration
| Before | After |
|--------|-------|
| Custom CSS height animation | daisyUI `collapse collapse-arrow` (CSS-only) |
| `duration` prop | Kept for API compat; CSS uses `--duration-panel` |

---

## Accessibility Notes

All components follow WCAG 2.1 AA guidelines:

### Focus Management
- All interactive elements have `:focus-visible` styles (defined globally in `layout.css`)
- Skip links on all pages (`<a href="#main-content" class="btn btn-primary btn-sm fixed...">`)
- Focus restoration on modal/drawer close
- Keyboard trap in modals (`<dialog>`) and drawer

### ARIA
- Icon-only buttons have `aria-label` (e.g., `<button aria-label="Tutup menu">`)
- Modals use native `<dialog>` with `role="dialog"`
- Live regions for dynamic content (`role="status" aria-live="polite"`)
- Form inputs have associated `<label>` elements
- Dropdown menus use `role="listbox"` / `role="option"`

### Color Contrast
- Verified via `npm run check:contrast` (≥4.5:1 body, ≥3:1 large in both themes)
- Semantic color tokens used consistently (`--color-primary`, `--color-base-content`, etc.)

### Semantic HTML
- Headings: `h1` → `h2` → `h3` hierarchy
- Forms use `fieldset` + `legend` for grouping
- Tables have `<thead>` / `<tbody>` with `scope="col"`
- Lists use `<ul>` / `<li>` with proper roles

---

## Theming Notes

All components use **semantic design tokens** from `layout.css`:

### Color Tokens
```css
/* Surfaces */
--color-surface: var(--color-base-100);
--color-surface-hover: var(--color-base-200);
--color-border-subtle: var(--color-base-300);

/* Brand */
--color-primary: oklch(44% 0.115 158); /* bi-light */
--color-primary-content: oklch(98% 0.005 120);

/* Semantic */
--color-info, --color-success, --color-warning, --color-error
```

### Component Usage
```svelte
<!-- Good: uses semantic tokens -->
<div class="card card-border bg-base-100">
  <button class="btn btn-primary">Primary</button>
  <button class="btn btn-warning">Warning</button>
  <div class="alert alert-error">Error</div>
</div>

<!-- Avoid: hardcoded colors -->
<div class="bg-white border-gray-300">
  <button class="bg-emerald-600 text-white">Bad</button>
</div>
```

### Dark Mode
All components automatically adapt via `bi-dark` theme (prefers-color-scheme). No component-specific dark mode logic needed.

### Spacing Tokens
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 3rem;    /* 48px */
--space-12: 6rem;    /* 96px */
```

### Motion Tokens
```css
--motion-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast: 160ms;
--duration-base: 200ms;
--duration-panel: 250ms;
--stagger-delay: 30ms;
```

Entrance animations use `@starting-style` with `transition-delay: calc(var(--stagger-index) * var(--stagger-delay))`. Reduced motion respected globally.

---

## Migration Summary

| Component | Status | Breaking Changes |
|-----------|--------|------------------|
| PageHeader | ✅ Migrated | No (API identical) |
| EmptyState | ✅ Migrated | No (API identical) |
| BarList | ✅ Kept | N/A (uses color tokens) |
| LoadingState | ✅ Migrated | No (API identical) |
| LoadingButton | ✅ Migrated | No (API identical) |
| FormShell | ✅ Migrated | No (API identical) |
| Select | ✅ Migrated | No (API identical) |
| Skeleton | ✅ Migrated | No (API identical) |
| QuickSearch | ✅ Migrated | No (self-contained) |
| WaliForm | ✅ Migrated | No (API identical) |
| SantriForm | ✅ Migrated | No (API identical) |
| Collapse | ✅ Migrated | No (API identical, `duration` ignored) |

---

## Usage Guidelines

1. **Import from alias**: `import PageHeader from '$lib/components/PageHeader.svelte'`
2. **No custom CSS needed** - all styling via daisyUI classes
3. **Extend, don't override** - use `class` prop for additional classes
4. **Test both themes** - verify in `bi-light` and `bi-dark`
4. **Test reduced motion** - verify animations disable cleanly
5. **Keyboard test** - tab through all interactive elements

---

## Contributing

When adding new components:
1. Use daisyUI 5 primitives exclusively
2. Use semantic design tokens from `layout.css`
3. Add ARIA attributes for accessibility
4. Test in both themes + reduced motion
5. Update this README with new component entry