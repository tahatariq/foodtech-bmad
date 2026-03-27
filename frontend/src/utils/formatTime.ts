/**
 * Formats elapsed time from a start timestamp to a human-readable string.
 * - Under 1 minute: "45s"
 * - 1-59 minutes: "5m" or "5m 30s"
 * - 60+ minutes: "1h 2m"
 */
export function formatElapsedTime(startTime: string): string {
  const elapsedMs = Date.now() - new Date(startTime).getTime();
  return formatMs(Math.max(0, elapsedMs));
}

/**
 * Formats milliseconds to a human-readable elapsed time string.
 */
export function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}
