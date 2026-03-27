export type AttentionLevel = 'calm' | 'watching' | 'warning' | 'critical';

interface StationData {
  ticketCount: number;
  maxTicketAgeMs?: number;
}

export function getAttentionLevel(data: StationData): AttentionLevel {
  const ageMinutes = (data.maxTicketAgeMs ?? 0) / 60000;

  if (data.ticketCount >= 7 || ageMinutes >= 8) return 'critical';
  if (data.ticketCount >= 4 || ageMinutes >= 5) return 'warning';
  if (ageMinutes >= 3) return 'watching';
  return 'calm';
}

export function getTicketAttention(ticketAgeMs: number): AttentionLevel {
  const minutes = ticketAgeMs / 60000;
  if (minutes >= 8) return 'critical';
  if (minutes >= 5) return 'warning';
  if (minutes >= 3) return 'watching';
  return 'calm';
}
