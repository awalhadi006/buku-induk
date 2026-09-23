import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import LoadingState from '$lib/components/LoadingState.svelte';

describe('LoadingState', () => {
  it('renders skeleton while promise is pending', () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('data'), 100));
    render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 2, count: 1 },
        children: (data) => `<div>${data}</div>`
      }
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('data')).not.toBeInTheDocument();
  });

  it('renders children when promise resolves with data', async () => {
    const promise = Promise.resolve('loaded data');
    render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 1 },
        children: (data) => `<div class="result">${data}</div>`
      }
    });
    await vi.waitFor(() => {
      expect(screen.getByText('loaded data')).toBeInTheDocument();
    });
  });

  it('renders empty snippet when promise resolves with null', async () => {
    const promise = Promise.resolve(null);
    render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        empty: () => '<div class="empty">No data</div>',
        children: () => '<div>Has data</div>'
      }
    });
    await vi.waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
    expect(screen.queryByText('Has data')).not.toBeInTheDocument();
  });

  it('renders empty snippet when promise resolves with empty array', async () => {
    const promise = Promise.resolve([]);
    render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        empty: () => '<div class="empty">No items</div>',
        children: () => '<div>Has items</div>'
      }
    });
    await vi.waitFor(() => {
      expect(screen.getByText('No items')).toBeInTheDocument();
    });
  });

  it('renders error alert when promise rejects', async () => {
    const promise = Promise.reject(new Error('Failed to load'));
    render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        children: () => '<div>Data</div>'
      }
    });
    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Gagal memuat: Failed to load')).toBeInTheDocument();
    });
  });

  it('renders error alert with unknown error message when error has no message', async () => {
    const promise = Promise.reject('string error');
    render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        children: () => '<div>Data</div>'
      }
    });
    await vi.waitFor(() => {
      expect(screen.getByText('Gagal memuat: string error')).toBeInTheDocument();
    });
  });

  it('renders text variant skeleton correctly', () => {
    const promise = new Promise(() => {});
    const { container } = render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 3, count: 2 },
        children: () => '<div>Data</div>'
      }
    });
    const skeletons = container.querySelectorAll('.skeleton.skeleton-text');
    expect(skeletons).toHaveLength(6); // 3 rows * 2 count
  });

  it('renders card variant skeleton correctly', () => {
    const promise = new Promise(() => {});
    const { container } = render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'card', count: 3 },
        children: () => '<div>Data</div>'
      }
    });
    const skeletons = container.querySelectorAll('.skeleton.h-32');
    expect(skeletons).toHaveLength(3);
  });

  it('renders table variant skeleton correctly', () => {
    const promise = new Promise(() => {});
    const { container } = render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'table', rows: 2, cols: 4 },
        children: () => '<div>Data</div>'
      }
    });
    const rowContainers = container.querySelectorAll('[style*="grid-template-columns"]');
    expect(rowContainers).toHaveLength(2);
    const skeletons = container.querySelectorAll('.skeleton.h-10');
    expect(skeletons).toHaveLength(8); // 2 rows * 4 cols
  });

  it('renders stat variant skeleton correctly', () => {
    const promise = new Promise(() => {});
    const { container } = render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'stat', count: 4 },
        children: () => '<div>Data</div>'
      }
    });
    const skeletons = container.querySelectorAll('.skeleton.h-16');
    expect(skeletons).toHaveLength(4);
  });

  it('does not render skeleton when no skeleton config provided', () => {
    const promise = new Promise(() => {});
    render(LoadingState, {
      props: {
        data: promise,
        children: () => '<div>Data</div>'
      }
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('passes accessibility test with skeleton', async () => {
    const promise = new Promise(() => {});
    const { container } = render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 1 },
        children: () => '<div>Data</div>'
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with error state', async () => {
    const promise = Promise.reject(new Error('Error'));
    const { container } = render(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        children: () => '<div>Data</div>'
      }
    });
    await vi.waitFor(() => screen.getByRole('alert'));
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});