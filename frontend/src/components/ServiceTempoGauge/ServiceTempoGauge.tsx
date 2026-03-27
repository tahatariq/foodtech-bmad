import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../utils/useReducedMotion';

export type TempoStatus = 'green' | 'amber' | 'red';

interface ServiceTempoGaugeProps {
  value: number;
  target: number;
  status: TempoStatus;
  variant?: 'large' | 'compact';
}

const STATUS_COLORS: Record<TempoStatus, string> = {
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
};

const STATUS_LABELS: Record<TempoStatus, string> = {
  green: 'Flowing',
  amber: 'Watch',
  red: 'Critical',
};

export function ServiceTempoGauge({
  value,
  target,
  status,
  variant = 'large',
}: ServiceTempoGaugeProps) {
  const prefersReducedMotion = useReducedMotion();

  const isLarge = variant === 'large';
  const fontSize = isLarge ? '64px' : '32px';
  const maxValue = target * 2;
  const progressPct = Math.min(100, (value / maxValue) * 100);
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  const animation = prefersReducedMotion
    ? 'none'
    : status === 'red'
      ? 'ft-pulse-aggressive 1s ease-in-out infinite'
      : status === 'amber'
        ? 'ft-pulse-gentle 2s ease-in-out infinite'
        : 'none';

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: isLarge ? '8px' : '4px',
    padding: isLarge ? '16px' : '8px',
  };

  const numberStyle: CSSProperties = {
    fontSize,
    fontFamily: 'var(--ft-font-mono, monospace)',
    fontWeight: 700,
    color,
    lineHeight: 1,
    transition: 'color 0.3s ease',
    animation,
  };

  const barContainerStyle: CSSProperties = {
    width: '100%',
    maxWidth: isLarge ? '240px' : '160px',
    height: isLarge ? '8px' : '4px',
    borderRadius: '4px',
    backgroundColor: 'var(--ft-border, #334155)',
    overflow: 'hidden',
    position: 'relative',
  };

  const barFillStyle: CSSProperties = {
    height: '100%',
    width: `${progressPct}%`,
    backgroundColor: color,
    transition: 'width 0.5s ease, background-color 0.3s ease',
    borderRadius: '4px',
  };

  return (
    <div
      role="meter"
      aria-label={`Service Tempo: ${value} minutes, status ${status}`}
      aria-valuemin={0}
      aria-valuemax={maxValue}
      aria-valuenow={value}
      style={containerStyle}
    >
      <span style={numberStyle}>{value}</span>
      <span
        style={{
          fontSize: isLarge ? '0.875rem' : '0.625rem',
          color: 'var(--ft-text-secondary, #9CA3AF)',
        }}
      >
        avg minutes per ticket
      </span>
      <div style={barContainerStyle}>
        <div style={barFillStyle} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: isLarge ? '240px' : '160px',
          fontSize: '0.625rem',
          color: 'var(--ft-text-secondary, #9CA3AF)',
        }}
      >
        <span>0</span>
        <span>Target: {target}m</span>
        <span style={{ color: '#EF4444' }}>Critical: {maxValue}m</span>
      </div>
      <span
        style={{
          fontSize: isLarge ? '0.875rem' : '0.75rem',
          fontWeight: 600,
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}
