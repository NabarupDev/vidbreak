/**
 * Convert a time string or number to seconds.
 *
 * @param time - Time in 'HH:MM:SS.ms', 'MM:SS', seconds string, or number
 * @returns Time in seconds
 */
export function timeToSeconds(time: string | number): number {
  if (typeof time === 'number') {
    return time;
  }

  const trimmed = time.trim();

  // Try plain numeric string
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  const parts = trimmed.split(':');

  if (parts.length === 3) {
    // HH:MM:SS or HH:MM:SS.ms
    const hours = parseFloat(parts[0] ?? '0');
    const minutes = parseFloat(parts[1] ?? '0');
    const seconds = parseFloat(parts[2] ?? '0');
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    // MM:SS
    const minutes = parseFloat(parts[0] ?? '0');
    const seconds = parseFloat(parts[1] ?? '0');
    return minutes * 60 + seconds;
  }

  return parseFloat(trimmed) || 0;
}
