import type { CSSProperties } from 'react';

export type StationStatus = 'green' | 'yellow' | 'red';

interface StationStatusIndicatorProps {
  stationName: string;
  stationEmoji?: string | null;
  status: StationStatus;
  ticketCount: number;
  onClick?: () => void;
  expanded?: boolean;
}

const STATUS_COLORS: Record<StationStatus, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

const STATUS_TEXT: Record<StationStatus, string> = {
  green: 'Flowing',
  yellow: 'Watch',
  red: 'Backed up',
};

const STATUS_OPACITY: Record<StationStatus, number> = {
  green: 0.7,
  yellow: 1.0,
  red: 1.0,
};

export function StationStatusIndicator({
  stationName,
  stationEmoji,
  status,
  ticketCount,
  onClick,
  expanded = false,
}: StationStatusIndicatorProps) {
  const color = STATUS_COLORS[status];
  const text = STATUS_TEXT[status];
  const opacity = STATUS_OPACITY[status];

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor:
      status === 'yellow'
        ? 'rgba(245, 158, 11, 0.1)'
        : status === 'red'
          ? 'rgba(239, 68, 68, 0.1)'
          : 'transparent',
    cursor: onClick ? 'pointer' : 'default',
    border: '1px solid transparent',
    transition: 'background-color 0.2s',
  };

  const dotStyle: CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: color,
    opacity,
    flexShrink: 0,
    animation:
      status === 'red'
        ? 'ft-pulse-aggressive 1s ease-in-out infinite'
        : status === 'yellow'
          ? 'ft-pulse-gentle 2s ease-in-out infinite'
          : 'none',
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${stationName}: ${ticketCount} tickets, status ${text}`}
      aria-expanded={expanded}
      style={containerStyle}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span style={dotStyle} />
      <span style={{ fontSize: '1rem' }}>
        {stationEmoji && <span>{stationEmoji} </span>}
        <strong>{stationName}</strong>
      </span>
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '0.875rem',
          color: 'var(--ft-text-secondary, #9CA3AF)',
        }}
      >
        {ticketCount} tickets
      </span>
      <span
        style={{
          fontSize: '0.75rem',
          color,
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
}
