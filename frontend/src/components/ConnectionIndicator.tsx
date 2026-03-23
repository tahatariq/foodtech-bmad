import type { CSSProperties } from 'react';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

interface ConnectionIndicatorProps {
  status: ConnectionState;
}

const dotBase: CSSProperties = {
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  flexShrink: 0,
};

const styles: Record<ConnectionState, { dot: CSSProperties; label: string }> = {
  connected: {
    dot: { ...dotBase, backgroundColor: '#22C55E' },
    label: '',
  },
  reconnecting: {
    dot: {
      ...dotBase,
      backgroundColor: '#F59E0B',
      animation: 'ft-dot-pulse 1s ease-in-out infinite',
    },
    label: 'Reconnecting...',
  },
  offline: {
    dot: { ...dotBase, backgroundColor: '#EF4444' },
    label: 'Offline \u2014 bumps will sync',
  },
};

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const { dot, label } = styles[status];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 'var(--ft-target-size, 36px)',
        padding: '0 8px',
      }}
    >
      <span data-testid="connection-dot" style={dot} />
      {label && (
        <span data-testid="connection-label" style={{ fontSize: 'var(--ft-font-size-label, 12px)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
