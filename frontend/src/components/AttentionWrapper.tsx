import { type ReactNode, type CSSProperties, useEffect, useState } from 'react';

export type AttentionLevel =
  | 'healthy'
  | 'watching'
  | 'warning'
  | 'critical'
  | 'resolved';

interface AttentionWrapperProps {
  level: AttentionLevel;
  children: ReactNode;
}

const levelStyles: Record<AttentionLevel, CSSProperties> = {
  healthy: {
    opacity: 1,
    transform: 'scale(1)',
  },
  watching: {
    opacity: 1,
    borderColor: 'var(--ft-status-watching)',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  warning: {
    opacity: 1,
    animation: 'ft-pulse-gentle 1s ease-in-out infinite, ft-glow-amber 1s ease-in-out infinite',
  },
  critical: {
    opacity: 1,
    transform: 'scale(1.02)',
    animation:
      'ft-pulse-aggressive 0.5s ease-in-out infinite, ft-glow-red 0.5s ease-in-out infinite',
  },
  resolved: {
    opacity: 0.7,
    transform: 'scale(0.98)',
    transition: 'opacity var(--ft-transition-slow, 400ms), transform var(--ft-transition-slow, 400ms)',
  },
};

const reducedMotionStyles: Record<AttentionLevel, CSSProperties> = {
  healthy: { opacity: 1 },
  watching: {
    opacity: 1,
    borderColor: 'var(--ft-status-watching)',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  warning: {
    opacity: 1,
    borderColor: 'var(--ft-status-warning)',
    borderWidth: 2,
    borderStyle: 'solid',
  },
  critical: {
    opacity: 1,
    borderColor: 'var(--ft-status-critical)',
    borderWidth: 3,
    borderStyle: 'solid',
  },
  resolved: {
    opacity: 0.7,
  },
};

export function AttentionWrapper({ level, children }: AttentionWrapperProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const styles = prefersReducedMotion
    ? reducedMotionStyles[level]
    : levelStyles[level];

  return (
    <div
      data-testid="attention-wrapper"
      data-attention-level={level}
      style={{
        borderRadius: 'var(--ft-border-radius, 6px)',
        ...styles,
      }}
    >
      {children}
    </div>
  );
}
