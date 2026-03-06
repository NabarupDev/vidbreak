import type { Resolution, NamedResolution } from '../types/options.types.js';
import type { VideoProbe } from '../types/probe.types.js';

/**
 * A resolved resolution with computed scale filter.
 */
export interface ResolvedResolution {
  /** Resolution label, e.g. '1080p' or '1920x1080' */
  name: string;
  /** Target width in pixels */
  width: number;
  /** Target height (-2 for auto aspect ratio) or explicit */
  height: number;
  /** FFmpeg -vf scale= value, e.g. '1920:-2' */
  scaleFilter: string;
}

/**
 * Named resolution → target width mapping.
 * Height uses -2 for automatic even-number calculation.
 */
const NAMED_RESOLUTION_MAP: Record<NamedResolution, number> = {
  '4k': 3840,
  '2k': 2560,
  '1080p': 1920,
  '720p': 1280,
  '480p': 854,
  '360p': 640,
  '240p': 426,
  'original': 0, // Placeholder — uses probe.width
};

/**
 * Resolve requested resolutions to concrete width/height/scale-filter values.
 * Filters out any resolution wider than the source video.
 * Deduplicates by width.
 */
export function resolveResolutions(
  requested: Resolution[],
  probe: VideoProbe,
): ResolvedResolution[] {
  const seen = new Set<number>();
  const results: ResolvedResolution[] = [];

  for (const res of requested) {
    let width: number;
    let name: string;

    if (res === 'original') {
      width = probe.width;
      name = 'original';
    } else if (res in NAMED_RESOLUTION_MAP) {
      width = NAMED_RESOLUTION_MAP[res as NamedResolution] ?? 0;
      name = res;
    } else {
      // Custom WxH format
      const parts = res.split('x');
      width = parseInt(parts[0] ?? '0', 10);
      name = res;
    }

    // Skip resolutions wider than the source (no upscaling)
    if (width > probe.width) {
      continue;
    }

    // Deduplicate by width
    if (seen.has(width)) {
      continue;
    }
    seen.add(width);

    results.push({
      name,
      width,
      height: -2, // Auto aspect ratio, even divisor
      scaleFilter: `${String(width)}:-2`,
    });
  }

  return results;
}
