import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Skeleton from '$lib/components/Skeleton.svelte';

describe('Skeleton', () => {
  it('renders text variant by default', () => {
    render(Skeleton, { props: {} });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Memuat konten...');
    const skeletons = screen.getAllByTestId('skeleton-text') || document.querySelectorAll('.skeleton.skeleton-text');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders text variant with custom rows and count', () => {
    const { container } = render(Skeleton, { props: { variant: 'text', rows: 3, count: 2 } });
    const skeletons = container.querySelectorAll('.skeleton.skeleton-text');
    expect(skeletons).toHaveLength(6); // 3 rows * 2 count
  });

  it('renders card variant', () => {
    const { container } = render(Skeleton, { props: { variant: 'card', count: 3 } });
    const skeletons = container.querySelectorAll('.skeleton.h-32');
    expect(skeletons).toHaveLength(3);
  });

  it('renders table variant', () => {
    const { container } = render(Skeleton, { props: { variant: 'table', rows: 2, cols: 4 } });
    const rowContainers = container.querySelectorAll('[style*="grid-template-columns"]');
    expect(rowContainers).toHaveLength(2);
    const skeletons = container.querySelectorAll('.skeleton.h-10');
    expect(skeletons).toHaveLength(8); // 2 rows * 4 cols
  });

  it('renders stat variant', () => {
    const { container } = render(Skeleton, { props: { variant: 'stat', count: 4 } });
    const skeletons = container.querySelectorAll('.skeleton.h-16');
    expect(skeletons).toHaveLength(4);
  });

  it('applies custom class', () => {
    const { container } = render(Skeleton, { props: { class: 'custom-skeleton' } });
    const wrapper = container.querySelector('.space-y-3');
    expect(wrapper).toHaveClass('custom-skeleton');
  });

  it('uses custom ariaLabel', () => {
    render(Skeleton, { props: { ariaLabel: 'Loading data...' } });
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data...');
  });

  it('has correct role and aria attributes', () => {
    render(Skeleton, { props: {} });
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label');
  });

  it('passes accessibility test for text variant', async () => {
    const { container } = render(Skeleton, { props: { variant: 'text', rows: 2, count: 2 } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test for card variant', async () => {
    const { container } = render(Skeleton, { props: { variant: 'card', count: 2 } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test for table variant', async () => {
    const { container } = render(Skeleton, { props: { variant: 'table', rows: 2, cols: 3 } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test for stat variant', async () => {
    const { container } = render(Skeleton, { props: { variant: 'stat', count: 3 } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with custom ariaLabel', async () => {
    const { container } = render(Skeleton, { props: { ariaLabel: 'Custom loading message' } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});