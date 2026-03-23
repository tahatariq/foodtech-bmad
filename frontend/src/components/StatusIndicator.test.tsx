import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusIndicator } from './StatusIndicator';

describe('StatusIndicator', () => {
  it('renders healthy status with green color and checkmark icon', () => {
    render(<StatusIndicator status="healthy" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveAttribute('data-status', 'healthy');
    const icon = screen.getByTestId('status-icon');
    expect(icon).toHaveAttribute('stroke', '#22C55E');
  });

  it('renders warning status with amber color and stripe pattern', () => {
    render(<StatusIndicator status="warning" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveAttribute('data-status', 'warning');
    expect(indicator.style.backgroundImage).toContain(
      'repeating-linear-gradient',
    );
    const icon = screen.getByTestId('status-icon');
    expect(icon).toHaveAttribute('stroke', '#F59E0B');
  });

  it('renders critical status with red color and crosshatch pattern', () => {
    render(<StatusIndicator status="critical" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveAttribute('data-status', 'critical');
    const icon = screen.getByTestId('status-icon');
    expect(icon).toHaveAttribute('stroke', '#EF4444');
  });

  it('renders at different sizes', () => {
    const { unmount } = render(<StatusIndicator status="healthy" size="sm" />);
    expect(screen.getByTestId('status-indicator')).toHaveAttribute(
      'data-size',
      'sm',
    );
    expect(screen.getByTestId('status-indicator')).toHaveStyle({ width: '20px' });
    unmount();

    render(<StatusIndicator status="healthy" size="lg" />);
    expect(screen.getByTestId('status-indicator')).toHaveAttribute(
      'data-size',
      'lg',
    );
    expect(screen.getByTestId('status-indicator')).toHaveStyle({ width: '36px' });
  });
});
