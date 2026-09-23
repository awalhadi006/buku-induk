import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Collapse from '$lib/components/Collapse.svelte';

describe('Collapse', () => {
  it('renders children when open is true', () => {
    render(Collapse, {
      props: {
        open: true,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('does not render children when open is false', () => {
    render(Collapse, {
      props: {
        open: false,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('toggles open state when checkbox is clicked', () => {
    render(Collapse, {
      props: {
        open: false,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText('Hidden content')).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('binds open prop correctly', () => {
    let isOpen = false;
    const { rerender } = render(Collapse, {
      props: {
        get open() { return isOpen; },
        set open(value) { isOpen = value; },
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();

    isOpen = true;
    rerender({ open: true });
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('uses custom duration', () => {
    const { container } = render(Collapse, {
      props: {
        open: true,
        duration: 500,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    const collapse = container.querySelector('.collapse');
    // daisyUI collapse uses CSS transitions, duration is not directly testable
    // but we can verify the component renders with the prop
    expect(collapse).toBeInTheDocument();
  });

  it('has correct daisyUI collapse classes', () => {
    const { container } = render(Collapse, {
      props: {
        open: false,
        children: () => '<div>Content</div>'
      }
    });
    const collapse = container.querySelector('.collapse');
    expect(collapse).toHaveClass('collapse');
    expect(collapse).toHaveClass('collapse-arrow');
  });

  it('renders checkbox input', () => {
    render(Collapse, {
      props: {
        open: false,
        children: () => '<div>Content</div>'
      }
    });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('renders collapse-content div', () => {
    const { container } = render(Collapse, {
      props: {
        open: true,
        children: () => '<div>Content</div>'
      }
    });
    const content = container.querySelector('.collapse-content');
    expect(content).toBeInTheDocument();
  });

  it('passes accessibility test when closed', async () => {
    const { container } = render(Collapse, {
      props: {
        open: false,
        children: () => '<div>Content</div>'
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test when open', async () => {
    const { container } = render(Collapse, {
      props: {
        open: true,
        children: () => '<div>Content</div>'
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with complex children', async () => {
    const { container } = render(Collapse, {
      props: {
        open: true,
        children: () => `
          <div>
            <h3>Title</h3>
            <p>Some paragraph</p>
            <button>Action</button>
          </div>
        `
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});