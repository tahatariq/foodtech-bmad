import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useOfflineStore } from '../stores/offlineStore';

describe('ConnectionIndicator', () => {
  beforeEach(() => {
    const store = useOfflineStore.getState();
    store.clearQueue();
    store.setOffline(false);
    store.resetReconnectAttempts();
    store.setLastSyncTimestamp(new Date().toISOString());
  });

  it('renders green dot for connected state with no label', () => {
    render(<ConnectionIndicator status="connected" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#22C55E' });
    expect(screen.queryByTestId('connection-label')).toBeNull();
  });

  it('renders amber pulsing dot with "Reconnecting..." text after 3+ attempts', () => {
    act(() => {
      const store = useOfflineStore.getState();
      for (let i = 0; i < 4; i++) store.incrementReconnectAttempts();
    });

    render(<ConnectionIndicator status="reconnecting" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#F59E0B' });
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'Reconnecting...',
    );
  });

  it('suppresses reconnecting UI for first 3 attempts (level 1 silent)', () => {
    act(() => {
      const store = useOfflineStore.getState();
      store.incrementReconnectAttempts();
      store.incrementReconnectAttempts();
    });

    render(<ConnectionIndicator status="reconnecting" />);
    // Should show as connected (suppressed)
    expect(screen.queryByTestId('connection-label')).toBeNull();
  });

  it('renders red dot with "bumps will sync" text for offline', () => {
    render(<ConnectionIndicator status="offline" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#EF4444' });
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'bumps will sync',
    );
  });

  it('shows queued bump count in offline label', () => {
    act(() => {
      const store = useOfflineStore.getState();
      store.queueBump('order-1', 'station-1');
      store.queueBump('order-2', 'station-1');
      store.queueBump('order-3', 'station-1');
    });

    render(<ConnectionIndicator status="offline" />);
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'Offline \u2014 3 bumps will sync',
    );
  });

  it('shows singular "bump" for single queued item', () => {
    act(() => {
      useOfflineStore.getState().queueBump('order-1', 'station-1');
    });

    render(<ConnectionIndicator status="offline" />);
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'Offline \u2014 1 bump will sync',
    );
  });

  it('has role="status" and aria-live="polite"', () => {
    render(<ConnectionIndicator status="connected" />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('renders stale state with amber dot and delay message', () => {
    render(<ConnectionIndicator status="stale" />);
    expect(screen.getByTestId('connection-label')).toHaveTextContent(
      'Data may be delayed',
    );
  });
});
