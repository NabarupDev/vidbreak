import { mkdir } from 'node:fs/promises';

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}
