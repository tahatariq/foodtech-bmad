import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BumpButton } from './BumpButton';

describe('BumpButton', () => {
  it('renders with "BUMP" label', () => {
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId('bump-button')).toHaveTextContent('BUMP');
  });

  it('has correct aria-label with order number and next stage', () => {
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId('bump-button')).toHaveAttribute(
      'aria-label',
      'Advance order ORD-001 to preparing',
    );
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByTestId('bump-button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows disabled state', () => {
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByTestId('bump-button')).toBeDisabled();
    expect(screen.getByTestId('bump-button')).toHaveStyle({ opacity: '0.5' });
  });

  it('has 56dp minimum height via CSS variable', () => {
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={vi.fn()}
      />,
    );
    const btn = screen.getByTestId('bump-button');
    // minHeight set via CSS var with 56px fallback
    expect(btn.style.minHeight).toContain('56');
  });

  it('responds to Enter key press', () => {
    const onClick = vi.fn();
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={onClick}
      />,
    );
    const button = screen.getByTestId('bump-button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('responds to Space key press', () => {
    const onClick = vi.fn();
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={onClick}
      />,
    );
    const button = screen.getByTestId('bump-button');
    fireEvent.keyDown(button, { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows focus ring on focus', () => {
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByTestId('bump-button');
    fireEvent.focus(button);
    // Focus ring uses box-shadow
    expect(button.style.boxShadow).toBeTruthy();
  });

  it('removes focus ring on blur', () => {
    render(
      <BumpButton
        orderNumber="ORD-001"
        nextStageName="preparing"
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByTestId('bump-button');
    fireEvent.focus(button);
    fireEvent.blur(button);
    expect(button.style.boxShadow).toBeFalsy();
  });
});
