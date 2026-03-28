interface CountdownETAProps {
  minutes: number;
  isReady?: boolean;
  variant?: 'large' | 'compact';
}

export function CountdownETA({
  minutes,
  isReady = false,
  variant = 'compact',
}: CountdownETAProps) {
  const sizeClass = variant === 'large' ? 'text-3xl' : 'text-lg';

  if (isReady) {
    return (
      <span
        role="timer"
        aria-label="Ready now"
        aria-live="polite"
        className={`${sizeClass} font-bold text-green-600`}
        data-testid="countdown-eta"
      >
        NOW
      </span>
    );
  }

  const colorClass = minutes < 3 ? 'text-amber-500 font-semibold' : 'text-gray-600';

  return (
    <span
      role="timer"
      aria-label={`Estimated ${minutes} minutes`}
      aria-live="polite"
      className={`${sizeClass} ${colorClass}`}
      data-testid="countdown-eta"
    >
      ~{minutes} min
    </span>
  );
}
