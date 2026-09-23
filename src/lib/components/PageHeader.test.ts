import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import PageHeader from '$lib/components/PageHeader.svelte';

describe('PageHeader', () => {
  it('renders title and description', () => {
    render(PageHeader, { props: { title: 'Test Title', desc: 'Test description' } });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    render(PageHeader, { props: { title: 'Test Title' } });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('renders back link when backHref is provided', () => {
    render(PageHeader, { props: { title: 'Test Title', backHref: '/back' } });
    const backLink = screen.getByRole('link', { name: 'Kembali' });
    expect(backLink).toHaveAttribute('href', '/back');
  });

  it('does not render back link when backHref is not provided', () => {
    render(PageHeader, { props: { title: 'Test Title' } });
    expect(screen.queryByRole('link', { name: 'Kembali' })).not.toBeInTheDocument();
  });

  it('renders actions snippet when provided', () => {
    render(PageHeader, {
      props: {
        title: 'Test Title',
        actions: () => '<button class="btn btn-primary">Action</button>'
      }
    });
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('has correct daisyUI card classes', () => {
    render(PageHeader, { props: { title: 'Test Title' } });
    const card = screen.getByTestId('page-header-card')?.closest('.card') || screen.getByRole('heading', { level: 1 }).closest('.card');
    expect(card).toHaveClass('card');
    expect(card).toHaveClass('card-border');
    expect(card).toHaveClass('sm:card-side');
  });

  it('passes accessibility test', async () => {
    const { container } = render(PageHeader, { props: { title: 'Test Title', desc: 'Test description', backHref: '/back' } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});