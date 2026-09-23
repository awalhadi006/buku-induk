import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import EmptyState from '$lib/components/EmptyState.svelte';

describe('EmptyState', () => {
  it('renders title', () => {
    render(EmptyState, { props: { title: 'No data found' } });
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(EmptyState, { props: { title: 'No data', desc: 'Try adjusting your filters' } });
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(EmptyState, { props: { title: 'No data' } });
    expect(screen.queryByText('Try adjusting your filters')).not.toBeInTheDocument();
  });

  it('renders children snippet when provided', () => {
    render(EmptyState, {
      props: {
        title: 'No data',
        children: () => '<button class="btn btn-primary">Add new</button>'
      }
    });
    expect(screen.getByRole('button', { name: 'Add new' })).toBeInTheDocument();
  });

  it('has correct daisyUI classes and role', () => {
    render(EmptyState, { props: { title: 'No data' } });
    const container = screen.getByRole('status');
    expect(container).toHaveClass('card');
    expect(container).toHaveClass('card-dash');
    expect(container).toHaveClass('card-border');
    expect(container).toHaveClass('bg-base-200/40');
    expect(container).toHaveClass('empty-state');
  });

  it('passes accessibility test', async () => {
    const { container } = render(EmptyState, { props: { title: 'No data', desc: 'Try again' } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with children', async () => {
    const { container } = render(EmptyState, {
      props: {
        title: 'No data',
        children: () => '<button class="btn btn-primary">Add</button>'
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});