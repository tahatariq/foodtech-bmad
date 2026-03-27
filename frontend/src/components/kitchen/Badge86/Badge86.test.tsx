import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge86 } from './Badge86';

describe('Badge86', () => {
  it('renders 86 text', () => {
    render(<Badge86 itemName="Salmon" />);
    expect(screen.getByRole('status')).toHaveTextContent('86');
  });

  it('includes item name in aria-label', () => {
    render(<Badge86 itemName="Salmon" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      "Salmon is 86'd (unavailable)",
    );
  });

  it('renders at sm size by default', () => {
    render(<Badge86 itemName="Salmon" />);
    const badge = screen.getByRole('status');
    expect(badge.style.fontSize).toBe('0.625rem');
  });

  it('renders at md size', () => {
    render(<Badge86 itemName="Salmon" size="md" />);
    const badge = screen.getByRole('status');
    expect(badge.style.fontSize).toBe('0.75rem');
  });
});
