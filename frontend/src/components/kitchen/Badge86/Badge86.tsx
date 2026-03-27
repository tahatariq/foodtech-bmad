import type { CSSProperties } from 'react';

interface Badge86Props {
  itemName: string;
  size?: 'sm' | 'md';
}

const sizeStyles: Record<string, CSSProperties> = {
  sm: { fontSize: '0.625rem', padding: '1px 4px' },
  md: { fontSize: '0.75rem', padding: '2px 6px' },
};

export function Badge86({ itemName, size = 'sm' }: Badge86Props) {
  return (
    <span
      role="status"
      aria-label={`${itemName} is 86'd (unavailable)`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: 'var(--ft-status-danger, #DC2626)',
        color: '#fff',
        borderRadius: '4px',
        fontWeight: 700,
        fontFamily: 'var(--ft-font-mono, monospace)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1,
        ...sizeStyles[size],
      }}
    >
      86
    </span>
  );
}
