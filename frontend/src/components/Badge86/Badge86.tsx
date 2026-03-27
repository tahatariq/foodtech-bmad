import type { CSSProperties } from 'react';

interface Badge86Props {
  itemName: string;
  variant?: 'inline' | 'board';
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#EF4444',
  color: '#FFFFFF',
  fontWeight: 700,
  borderRadius: 9999,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const variantStyles: Record<string, CSSProperties> = {
  inline: {
    fontSize: 11,
    padding: '2px 6px',
    marginLeft: 6,
  },
  board: {
    fontSize: 14,
    padding: '4px 10px',
  },
};

export function Badge86({ itemName, variant = 'inline' }: Badge86Props) {
  return (
    <span
      role="status"
      aria-label={`${itemName} is 86'd \u2014 unavailable`}
      data-testid="badge-86"
      style={{
        ...baseStyle,
        ...variantStyles[variant],
      }}
    >
      86&apos;d
    </span>
  );
}
