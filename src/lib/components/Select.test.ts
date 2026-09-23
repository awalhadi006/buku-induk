import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Select from '$lib/components/Select.svelte';

describe('Select', () => {
  const defaultOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' }
  ];

  const defaultProps = {
    name: 'test-select',
    options: defaultOptions
  };

  it('renders select with placeholder option', () => {
    render(Select, { props: defaultProps });
    const select = screen.getByRole('combobox', { name: '— Pilih —' });
    expect(select).toBeInTheDocument();
    expect(screen.getByText('— Pilih —')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(Select, { props: defaultProps });
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
  });

  it('binds value correctly', () => {
    render(Select, { props: { ...defaultProps, value: '2' } });
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('2');
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(Select, { props: { ...defaultProps, onChange: handleChange } });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '3' } });
    expect(handleChange).toHaveBeenCalledWith('3');
  });

  it('applies required attribute when required is true', () => {
    render(Select, { props: { ...defaultProps, required: true } });
    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
  });

  it('does not apply required attribute when required is false', () => {
    render(Select, { props: { ...defaultProps, required: false } });
    const select = screen.getByRole('combobox');
    expect(select).not.toBeRequired();
  });

  it('disables select when disabled is true', () => {
    render(Select, { props: { ...defaultProps, disabled: true } });
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('enables select when disabled is false', () => {
    render(Select, { props: { ...defaultProps, disabled: false } });
    const select = screen.getByRole('combobox');
    expect(select).not.toBeDisabled();
  });

  it('applies custom class', () => {
    const { container } = render(Select, { props: { ...defaultProps, class: 'custom-class' } });
    const select = container.querySelector('select');
    expect(select).toHaveClass('custom-class');
  });

  it('renders with custom placeholder', () => {
    render(Select, { props: { ...defaultProps, placeholder: 'Choose...' } });
    expect(screen.getByText('Choose...')).toBeInTheDocument();
  });

  it('has correct daisyUI select classes', () => {
    const { container } = render(Select, { props: defaultProps });
    const select = container.querySelector('select');
    expect(select).toHaveClass('select');
    expect(select).toHaveClass('select-bordered');
    expect(select).toHaveClass('w-full');
  });

  it('has label associated with select via for/id', () => {
    const { container } = render(Select, { props: defaultProps });
    const label = container.querySelector('label');
    const select = container.querySelector('select');
    expect(label).toHaveAttribute('for', 'test-select');
    expect(select).toHaveAttribute('id', 'test-select');
  });

  it('handles empty options array', () => {
    render(Select, { props: { name: 'empty', options: [] } });
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // Only placeholder option should exist
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(1);
  });

  it('passes accessibility test', async () => {
    const { container } = render(Select, { props: defaultProps });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test when disabled', async () => {
    const { container } = render(Select, { props: { ...defaultProps, disabled: true } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test when required', async () => {
    const { container } = render(Select, { props: { ...defaultProps, required: true } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});