import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge86 } from './Badge86';

describe('Badge86', () => {
  it('renders with correct text content', () => {
    render(<Badge86 itemName="Burger" />);
    const badge = screen.getByTestId('badge-86');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("86'd");
  });

  it('has role="status"', () => {
    render(<Badge86 itemName="Burger" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('has correct aria-label with item name', () => {
    render(<Badge86 itemName="Burger" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute(
      'aria-label',
      "Burger is 86'd \u2014 unavailable",
    );
  });

  it('renders inline variant by default', () => {
    render(<Badge86 itemName="Fries" />);
    const badge = screen.getByTestId('badge-86');
    expect(badge.style.fontSize).toBe('11px');
  });

  it('renders board variant with larger font', () => {
    render(<Badge86 itemName="Fries" variant="board" />);
    const badge = screen.getByTestId('badge-86');
    expect(badge.style.fontSize).toBe('14px');
  });

  it('has red background and white text', () => {
    render(<Badge86 itemName="Salad" />);
    const badge = screen.getByTestId('badge-86');
    expect(badge.style.backgroundColor).toBe('rgb(239, 68, 68)');
    expect(badge.style.color).toBe('rgb(255, 255, 255)');
  });
});
