import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import LoadingButton from '$lib/components/LoadingButton.svelte';

describe('LoadingButton', () => {
  it('renders button with children when not loading', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: false
      }
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveClass('loading');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveClass('loading');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        disabled: true,
        loading: false
      }
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(LoadingButton, {
      props: {
        children: () => 'Submit',
        variant: 'secondary'
      }
    });
    const button = container.querySelector('button');
    expect(button).toHaveClass('btn-secondary');
  });

  it('applies size classes correctly', () => {
    const { container } = render(LoadingButton, {
      props: {
        children: () => 'Submit',
        size: 'lg'
      }
    });
    const button = container.querySelector('button');
    expect(button).toHaveClass('btn-lg');
  });

  it('applies custom class', () => {
    const { container } = render(LoadingButton, {
      props: {
        children: () => 'Submit',
        class: 'custom-class'
      }
    });
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('sets type attribute correctly', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        type: 'button'
      }
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('sets aria-label when provided', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        ariaLabel: 'Submit form'
      }
    });
    const button = screen.getByRole('button', { name: 'Submit form' });
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });

  it('sets aria-busy when loading', () => {
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        onclick: handleClick
      }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        disabled: true,
        onclick: handleClick
      }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true,
        onclick: handleClick
      }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('passes accessibility test in default state', async () => {
    const { container } = render(LoadingButton, {
      props: {
        children: () => 'Submit'
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test in loading state', async () => {
    const { container } = render(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with all variants', async () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'outline', 'ghost'] as const;
    for (const variant of variants) {
      const { container } = render(LoadingButton, {
        props: {
          children: () => 'Submit',
          variant
        }
      });
      const results = await global.axe.run(container);
      expect(results).toHaveNoViolations();
    }
  });
});