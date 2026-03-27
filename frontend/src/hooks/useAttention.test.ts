import { describe, it, expect } from 'vitest';
import { useAttention } from './useAttention';

describe('useAttention', () => {
  it('returns healthy for < 3 minutes', () => {
    expect(useAttention(0)).toBe('healthy');
    expect(useAttention(2 * 60 * 1000)).toBe('healthy');
  });

  it('returns watching for 3-5 minutes', () => {
    expect(useAttention(3 * 60 * 1000)).toBe('watching');
    expect(useAttention(4 * 60 * 1000)).toBe('watching');
  });

  it('returns warning for 5-8 minutes', () => {
    expect(useAttention(5 * 60 * 1000)).toBe('warning');
    expect(useAttention(7 * 60 * 1000)).toBe('warning');
  });

  it('returns critical for 8+ minutes', () => {
    expect(useAttention(8 * 60 * 1000)).toBe('critical');
    expect(useAttention(15 * 60 * 1000)).toBe('critical');
  });

  it('accepts custom thresholds', () => {
    expect(
      useAttention(60_000, { watchingMs: 30_000, warningMs: 45_000, criticalMs: 60_000 }),
    ).toBe('critical');
  });
});
