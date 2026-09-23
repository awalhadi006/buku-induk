import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import BarList from '$lib/components/BarList.svelte';

describe('BarList', () => {
  const defaultRows = [
    { label: 'Label 1', value: 50 },
    { label: 'Label 2', value: 30 },
    { label: 'Label 3', value: 20 }
  ];

  it('renders all rows with labels and values', () => {
    render(BarList, { props: { rows: defaultRows, max: 100 } });
    expect(screen.getByText('Label 1')).toBeInTheDocument();
    expect(screen.getByText('Label 2')).toBeInTheDocument();
    expect(screen.getByText('Label 3')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('calculates bar widths correctly based on max', () => {
    const { container } = render(BarList, { props: { rows: defaultRows, max: 100 } });
    const bars = container.querySelectorAll('.bg-primary');
    expect(bars).toHaveLength(3);
    // 50% width for first bar (50/100)
    expect(bars[0]).toHaveStyle('width: 50%');
    // 30% width for second bar (30/100)
    expect(bars[1]).toHaveStyle('width: 30%');
    // 20% width for third bar (20/100)
    expect(bars[2]).toHaveStyle('width: 20%');
  });

  it('handles zero max value', () => {
    const { container } = render(BarList, { props: { rows: defaultRows, max: 0 } });
    const bars = container.querySelectorAll('.bg-primary');
    bars.forEach(bar => {
      expect(bar).toHaveStyle('width: 0%');
    });
  });

  it('renders empty state message when rows array is empty', () => {
    render(BarList, { props: { rows: [], max: 100 } });
    expect(screen.getByText('Belum ada data.')).toBeInTheDocument();
  });

  it('handles single row', () => {
    render(BarList, { props: { rows: [{ label: 'Single', value: 42 }], max: 100 } });
    expect(screen.getByText('Single')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles values exceeding max', () => {
    const { container } = render(BarList, { props: { rows: [{ label: 'Over', value: 150 }], max: 100 } });
    const bar = container.querySelector('.bg-primary');
    expect(bar).toHaveStyle('width: 150%');
  });

  it('has correct structure with flex layout', () => {
    const { container } = render(BarList, { props: { rows: defaultRows, max: 100 } });
    const rowElements = container.querySelectorAll('.flex.items-center.gap-3.py-1.5');
    expect(rowElements).toHaveLength(3);
  });

  it('passes accessibility test', async () => {
    const { container } = render(BarList, { props: { rows: defaultRows, max: 100 } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with empty rows', async () => {
    const { container } = render(BarList, { props: { rows: [], max: 100 } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});