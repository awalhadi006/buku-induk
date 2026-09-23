import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import FormShell from '$lib/components/FormShell.svelte';

describe('FormShell', () => {
  const defaultProps = {
    submitLabel: 'Simpan',
    cancelHref: '/cancel',
    children: () => '<input name="test" class="input input-bordered" />'
  };

  it('renders form with children', () => {
    render(FormShell, { props: defaultProps });
    expect(screen.getByRole('textbox', { name: 'test' })).toBeInTheDocument();
  });

  it('renders submit button with label', () => {
    render(FormShell, { props: defaultProps });
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
  });

  it('renders cancel link with href', () => {
    render(FormShell, { props: defaultProps });
    const cancelLink = screen.getByRole('link', { name: 'Batal' });
    expect(cancelLink).toHaveAttribute('href', '/cancel');
  });

  it('renders error alert when error prop is provided', () => {
    render(FormShell, { props: { ...defaultProps, error: 'Something went wrong' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render error alert when error is null', () => {
    render(FormShell, { props: { ...defaultProps, error: null } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render error alert when error is undefined', () => {
    render(FormShell, { props: { ...defaultProps, error: undefined } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows loading state on submit button when submitting', () => {
    render(FormShell, { props: { ...defaultProps, submitting: true } });
    const submitButton = screen.getByRole('button', { name: 'Simpan' });
    expect(submitButton).toHaveClass('loading');
    expect(submitButton).toBeDisabled();
  });

  it('sets form action when action prop provided and no onSubmit', () => {
    render(FormShell, { props: { ...defaultProps, action: '/submit' } });
    const form = screen.getByRole('form') || screen.getByTestId('form') || document.querySelector('form');
    expect(form).toHaveAttribute('action', '/submit');
  });

  it('does not set form action when onSubmit is provided', () => {
    const onSubmit = vi.fn();
    render(FormShell, { props: { ...defaultProps, action: '/submit', onSubmit } });
    const form = document.querySelector('form');
    expect(form).not.toHaveAttribute('action');
  });

  it('calls onSubmit handler and prevents default when onSubmit provided', async () => {
    const onSubmit = vi.fn();
    render(FormShell, { props: { ...defaultProps, onSubmit } });
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders extra snippet when provided', () => {
    render(FormShell, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra content</div>'
      }
    });
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });

  it('has correct form enctype for file uploads', () => {
    render(FormShell, { props: defaultProps });
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  it('has correct daisyUI card classes', () => {
    const { container } = render(FormShell, { props: defaultProps });
    const card = container.querySelector('.card');
    expect(card).toHaveClass('card');
    expect(card).toHaveClass('card-border');
  });

  it('passes accessibility test with no error', async () => {
    const { container } = render(FormShell, { props: defaultProps });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with error', async () => {
    const { container } = render(FormShell, { props: { ...defaultProps, error: 'Error message' } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with submitting state', async () => {
    const { container } = render(FormShell, { props: { ...defaultProps, submitting: true } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with extra content', async () => {
    const { container } = render(FormShell, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra</div>'
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});