import { describe, it, expect } from 'vitest';
import { formatMs } from './formatTime';

describe('formatMs', () => {
  it('returns "0s" for 0ms', () => {
    expect(formatMs(0)).toBe('0s');
  });

  it('returns seconds for under 1 minute', () => {
    expect(formatMs(45_000)).toBe('45s');
  });

  it('returns "59s" for 59 seconds', () => {
    expect(formatMs(59_000)).toBe('59s');
  });

  it('returns minutes only when seconds are 0', () => {
    expect(formatMs(60_000)).toBe('1m');
    expect(formatMs(300_000)).toBe('5m');
  });

  it('returns minutes and seconds', () => {
    expect(formatMs(90_000)).toBe('1m 30s');
    expect(formatMs(330_000)).toBe('5m 30s');
  });

  it('returns hours and minutes for 60+ minutes', () => {
    expect(formatMs(3_600_000)).toBe('1h');
    expect(formatMs(3_720_000)).toBe('1h 2m');
  });

  it('returns hours only when minutes are 0', () => {
    expect(formatMs(7_200_000)).toBe('2h');
  });

  it('handles 59m 59s correctly', () => {
    expect(formatMs(3_599_000)).toBe('59m 59s');
  });
});
