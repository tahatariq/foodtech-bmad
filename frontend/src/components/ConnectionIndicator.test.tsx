import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConnectionIndicator } from './ConnectionIndicator';

describe('ConnectionIndicator', () => {
  it('renders green dot for connected state with no label', () => {
    render(<ConnectionIndicator status="connected" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#22C55E' });
    expect(screen.queryByTestId('connection-label')).toBeNull();
  });

  it('renders amber pulsing dot with "Reconnecting..." text', () => {
    render(<ConnectionIndicator status="reconnecting" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#F59E0B' });
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'Reconnecting...',
    );
  });

  it('renders red dot with "bumps will sync" text for offline', () => {
    render(<ConnectionIndicator status="offline" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#EF4444' });
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'bumps will sync',
    );
  });

  it('has role="status" and aria-live="polite"', () => {
    render(<ConnectionIndicator status="connected" />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
