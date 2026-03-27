import { useState, useEffect, type CSSProperties } from 'react';
import { useOfflineStore } from '../stores/offlineStore';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline' | 'stale';

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

const styleMap: Record<ConnectionState, { dot: CSSProperties; label: string }> = {
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
  stale: {
    dot: {
      ...dotBase,
      backgroundColor: '#F59E0B',
    },
    label: 'Data may be delayed',
  },
};

const STALE_THRESHOLD_MS = 30_000;

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const queuedBumpCount = useOfflineStore((s) => s.queuedBumps.length);
  const lastSyncTimestamp = useOfflineStore((s) => s.lastSyncTimestamp);
  const reconnectAttempts = useOfflineStore((s) => s.reconnectAttempts);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (status === 'connected' || status === 'reconnecting') {
      const interval = setInterval(() => {
        if (lastSyncTimestamp) {
          const sinceLast = Date.now() - new Date(lastSyncTimestamp).getTime();
          setIsStale(sinceLast >= STALE_THRESHOLD_MS);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    setIsStale(false);
  }, [status, lastSyncTimestamp]);

  // Determine effective display state
  let effectiveStatus = status;
  if (status === 'connected' && isStale) {
    effectiveStatus = 'stale';
  }

  // Level 1: suppress reconnecting UI for first 3 attempts
  if (status === 'reconnecting' && reconnectAttempts <= 3) {
    effectiveStatus = 'connected';
  }

  const { dot, label: baseLabel } = styleMap[effectiveStatus];

  // Append queued bump count to offline label
  let label = baseLabel;
  if (effectiveStatus === 'offline' && queuedBumpCount > 0) {
    label = `Offline \u2014 ${queuedBumpCount} bump${queuedBumpCount !== 1 ? 's' : ''} will sync`;
  }

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
