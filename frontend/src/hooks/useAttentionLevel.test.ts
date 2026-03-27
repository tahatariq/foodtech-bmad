import { describe, it, expect } from 'vitest';
import { getAttentionLevel, getTicketAttention } from './useAttentionLevel';

describe('getAttentionLevel', () => {
  it('returns calm for 0-3 tickets below 3 min', () => {
    expect(getAttentionLevel({ ticketCount: 2, maxTicketAgeMs: 2 * 60000 })).toBe('calm');
    expect(getAttentionLevel({ ticketCount: 0, maxTicketAgeMs: 0 })).toBe('calm');
  });

  it('returns watching for tickets 3-5 min', () => {
    expect(getAttentionLevel({ ticketCount: 2, maxTicketAgeMs: 4 * 60000 })).toBe('watching');
  });

  it('returns warning for 4-6 tickets or tickets 5-8 min', () => {
    expect(getAttentionLevel({ ticketCount: 5, maxTicketAgeMs: 2 * 60000 })).toBe('warning');
    expect(getAttentionLevel({ ticketCount: 2, maxTicketAgeMs: 6 * 60000 })).toBe('warning');
  });

  it('returns critical for 7+ tickets or tickets 8+ min', () => {
    expect(getAttentionLevel({ ticketCount: 8, maxTicketAgeMs: 0 })).toBe('critical');
    expect(getAttentionLevel({ ticketCount: 1, maxTicketAgeMs: 9 * 60000 })).toBe('critical');
  });
});

describe('getTicketAttention', () => {
  it('returns calm for 0-3 min', () => {
    expect(getTicketAttention(2 * 60000)).toBe('calm');
  });

  it('returns watching for 3-5 min', () => {
    expect(getTicketAttention(4 * 60000)).toBe('watching');
  });

  it('returns warning for 5-8 min', () => {
    expect(getTicketAttention(6 * 60000)).toBe('warning');
  });

  it('returns critical for 8+ min', () => {
    expect(getTicketAttention(9 * 60000)).toBe('critical');
  });
});
