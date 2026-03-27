import { type CSSProperties, useState } from 'react';

interface BumpButtonProps {
  orderNumber: string;
  nextStageName: string;
  onClick: () => void;
  disabled?: boolean;
}

const baseStyle: CSSProperties = {
  width: '100%',
  minHeight: 'var(--ft-bump-min-height, 56px)',
  padding: '0 1.5rem',
  backgroundColor: '#3B82F6',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--ft-border-radius, 8px)',
  fontSize: '1rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background-color 50ms, transform 50ms',
  marginTop: 'var(--ft-space-2, 12px)',
  outline: 'none',
};

const focusRingStyle: CSSProperties = {
  boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px #3B82F6',
};

export function BumpButton({
  orderNumber,
  nextStageName,
  onClick,
  disabled = false,
}: BumpButtonProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <button
      type="button"
      data-testid="bump-button"
      aria-label={`Advance order ${orderNumber} to ${nextStageName}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...(isFocused ? focusRingStyle : {}),
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPointerDown={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
          (e.currentTarget as HTMLElement).style.backgroundColor = '#2563EB';
        }
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.backgroundColor = '#3B82F6';
      }}
      onPointerLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.backgroundColor = '#3B82F6';
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      BUMP &rarr;
    </button>
  );
}
