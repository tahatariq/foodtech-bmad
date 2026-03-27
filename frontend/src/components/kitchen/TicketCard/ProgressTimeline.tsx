import { type CSSProperties } from 'react';
import { formatMs } from '../../../utils/formatTime';

interface ProgressTimelineProps {
  stageEnteredAt: string;
  expectedDurationMinutes: number;
  warningThresholdMinutes?: number;
  criticalThresholdMinutes?: number;
  elapsedMs: number;
}

function getBarColor(fillPercent: number, warningPct: number, criticalPct: number): string {
  if (fillPercent >= criticalPct) return 'var(--ft-status-critical, #EF4444)';
  if (fillPercent >= warningPct) return 'var(--ft-status-warning, #F59E0B)';
  return 'var(--ft-status-healthy, #22C55E)';
}

const trackStyle: CSSProperties = {
  width: '100%',
  height: 6,
  backgroundColor: 'var(--ft-bg-elevated, #323842)',
  borderRadius: 3,
  overflow: 'hidden',
  position: 'relative',
};

const timeStyle: CSSProperties = {
  fontSize: 'var(--ft-font-size-label, 14px)',
  color: 'var(--ft-text-secondary, #adb5bd)',
  fontVariantNumeric: 'tabular-nums',
  marginLeft: 8,
  whiteSpace: 'nowrap',
};

export function ProgressTimeline({
  expectedDurationMinutes,
  warningThresholdMinutes = 5,
  criticalThresholdMinutes = 8,
  elapsedMs,
}: ProgressTimelineProps) {
  const expectedMs = expectedDurationMinutes * 60_000;
  const fillPercent = expectedMs > 0 ? Math.min((elapsedMs / expectedMs) * 100, 100) : 0;

  const warningPct = expectedMs > 0 ? (warningThresholdMinutes * 60_000 / expectedMs) * 100 : 60;
  const criticalPct = expectedMs > 0 ? (criticalThresholdMinutes * 60_000 / expectedMs) * 100 : 100;

  const barColor = getBarColor(fillPercent, warningPct, criticalPct);

  return (
    <div
      data-testid="progress-timeline"
      style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}
      role="progressbar"
      aria-valuenow={Math.round(fillPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Stage progress: ${formatMs(elapsedMs)} elapsed`}
    >
      <div style={trackStyle}>
        <div
          data-testid="progress-fill"
          style={{
            height: '100%',
            width: `${fillPercent}%`,
            backgroundColor: barColor,
            borderRadius: 3,
            transition: 'width 1s linear, background-color 300ms',
          }}
        />
      </div>
      <span data-testid="progress-elapsed" style={timeStyle}>
        {formatMs(elapsedMs)}
      </span>
    </div>
  );
}
