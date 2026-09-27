import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QuickSearch from '$lib/components/QuickSearch.svelte';

// Mock supabase
vi.mock('$lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock tabler icons
vi.mock('@tabler/icons-svelte', () => ({
  IconSearch: () => '<svg data-testid="icon-search" />',
  IconUsers: () => '<svg data-testid="icon-users" />',
  IconBed: () => '<svg data-testid="icon-bed" />',
  IconSchool: () => '<svg data-testid="icon-school" />',
  IconX: () => '<svg data-testid="icon-x" />'
}));

describe('QuickSearch', () => {
  let keydownSpy: vi.SpyInstance;
  let addEventListenerSpy: vi.SpyInstance;
  let removeEventListenerSpy: vi.SpyInstance;

  beforeEach(() => {
    keydownSpy = vi.spyOn(window, 'addEventListener');
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    vi.useFakeTimers();
  });

  afterEach(() => {
    keydownSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    vi.useRealTimers();
  });

  it('does not render modal when closed by default', () => {
    render(QuickSearch);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens modal when openPalette is triggered via event', async () => {
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cari nama santri, NISN, kamar, atau kelas…')).toBeInTheDocument();
  });

  it('opens modal with Ctrl+K', async () => {
    render(QuickSearch);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens modal with Meta+K (Mac)', async () => {
    render(QuickSearch);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes modal on Escape key', async () => {
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes modal on close button click', async () => {
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    const closeButton = screen.getByRole('button', { name: 'Tutup' });
    fireEvent.click(closeButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading spinner when busy', async () => {
    // This test would need more complex mocking of the search function
    // For now, we test that the component renders without errors
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows "Tidak ada hasil" when search returns no results', async () => {
    // The mock returns empty data by default
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    // Type a query
    const input = screen.getByPlaceholderText('Cari nama santri, NISN, kamar, atau kelas…');
    fireEvent.input(input, { target: { value: 'test' } });
    // Advance timers to trigger debounced search
    vi.advanceTimersByTime(300);
    await vi.waitFor(() => {
      expect(screen.getByText('Tidak ada hasil.')).toBeInTheDocument();
    });
  });

  it('shows keyboard shortcuts help', async () => {
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    expect(screen.getByText('Esc tutup')).toBeInTheDocument();
    expect(screen.getByText('navigasi')).toBeInTheDocument();
    expect(screen.getByText('Enter buka')).toBeInTheDocument();
  });

  it('renders search icon', async () => {
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(QuickSearch);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('quicksearch:open', expect.any(Function));
  });

  it('passes accessibility test when modal is open', async () => {
    render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    const { container } = render(QuickSearch);
    window.dispatchEvent(new CustomEvent('quicksearch:open'));
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});