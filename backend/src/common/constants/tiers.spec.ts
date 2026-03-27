import { meetsMinimumTier, getNextTier } from './tiers';

describe('Tier utilities', () => {
  it('should correctly compare tier hierarchy', () => {
    expect(meetsMinimumTier('indie', 'indie')).toBe(true);
    expect(meetsMinimumTier('growth', 'indie')).toBe(true);
    expect(meetsMinimumTier('enterprise', 'indie')).toBe(true);
    expect(meetsMinimumTier('indie', 'growth')).toBe(false);
    expect(meetsMinimumTier('indie', 'enterprise')).toBe(false);
    expect(meetsMinimumTier('growth', 'enterprise')).toBe(false);
    expect(meetsMinimumTier('enterprise', 'enterprise')).toBe(true);
  });

  it('should return next tier correctly', () => {
    expect(getNextTier('indie')).toBe('growth');
    expect(getNextTier('growth')).toBe('enterprise');
    expect(getNextTier('enterprise')).toBeNull();
  });
});
