import type { CSSProperties } from 'react';

export type StatusLevel = 'healthy' | 'warning' | 'critical';
export type StatusSize = 'sm' | 'md' | 'lg';

interface StatusIndicatorProps {
  status: StatusLevel;
  size?: StatusSize;
}

const sizeMap: Record<StatusSize, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

const iconPaths: Record<StatusLevel, { path: string; viewBox: string }> = {
  healthy: {
    path: 'M20 6L9 17l-5-5',
    viewBox: '0 0 24 24',
  },
  warning: {
    path: 'M12 2L1 21h22L12 2zm0 14h.01M12 10v4',
    viewBox: '0 0 24 24',
  },
  critical: {
    path: 'M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 12.5L12 11l-3.5 3.5M8.5 8.5L12 12l3.5-3.5',
    viewBox: '0 0 24 24',
  },
};

const statusColors: Record<StatusLevel, string> = {
  healthy: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const patternStyles: Record<StatusLevel, CSSProperties> = {
  healthy: {
    backgroundColor: 'var(--ft-status-healthy-bg, rgba(34, 197, 94, 0.15))',
  },
  warning: {
    backgroundColor: 'var(--ft-status-warning-bg, rgba(245, 158, 11, 0.15))',
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(245, 158, 11, 0.12) 3px, rgba(245, 158, 11, 0.12) 6px)',
  },
  critical: {
    backgroundColor: 'var(--ft-status-critical-bg, rgba(239, 68, 68, 0.15))',
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(239, 68, 68, 0.12) 3px, rgba(239, 68, 68, 0.12) 6px), repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(239, 68, 68, 0.12) 3px, rgba(239, 68, 68, 0.12) 6px)',
  },
};

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const px = sizeMap[size];
  const color = statusColors[status];
  const icon = iconPaths[status];

  return (
    <span
      data-testid="status-indicator"
      data-status={status}
      data-size={size}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: px,
        height: px,
        borderRadius: '50%',
        ...patternStyles[status],
      }}
    >
      <svg
        data-testid="status-icon"
        width={px * 0.6}
        height={px * 0.6}
        viewBox={icon.viewBox}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={icon.path} />
      </svg>
    </span>
  );
}
