const UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Format a byte count into a human-readable string.
 *
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 2)
 * @returns Formatted string, e.g. '1.5 MB'
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    UNITS.length - 1,
  );

  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(dm)} ${UNITS[i] ?? 'Bytes'}`;
}
