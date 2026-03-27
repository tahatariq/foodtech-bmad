import type { AttentionLevel } from '../components/AttentionWrapper';

interface UseAttentionOptions {
  watchingMs?: number;
  warningMs?: number;
  criticalMs?: number;
}

const DEFAULTS = {
  watchingMs: 3 * 60 * 1000,
  warningMs: 5 * 60 * 1000,
  criticalMs: 8 * 60 * 1000,
};

export function useAttention(
  elapsedMs: number,
  options?: UseAttentionOptions,
): AttentionLevel {
  const { watchingMs, warningMs, criticalMs } = {
    ...DEFAULTS,
    ...options,
  };

  if (elapsedMs >= criticalMs) return 'critical';
  if (elapsedMs >= warningMs) return 'warning';
  if (elapsedMs >= watchingMs) return 'watching';
  return 'healthy';
}
