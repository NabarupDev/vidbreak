import type { ThumbnailOptions } from '../types/options.types.js';
import type { VideoProbe } from '../types/probe.types.js';
import { timeToSeconds } from '../utils/timeToSeconds.js';

/**
 * Build FFmpeg thumbnail extraction arguments using a filter graph (single-pass).
 *
 * @param options - Thumbnail generation configuration
 * @param probe - Input video probe data
 * @param outputPattern - Output filename pattern (e.g. 'thumb_%02d.jpg')
 * @returns FFmpeg CLI argument array
 */
export function buildThumbnailArgs(
  options: ThumbnailOptions,
  probe: VideoProbe,
  outputPattern: string,
): string[] {
  const width = options.width ?? 320;
  const format = options.format ?? 'jpg';
  const count = options.count ?? 3;

  const args: string[] = [];

  if (options.timestamps && options.timestamps.length > 0) {
    // Specific timestamps — use select filter with exact frame times
    const timeExprs = options.timestamps.map((t) => {
      const sec = typeof t === 'string' ? timeToSeconds(t) : t;
      return `gte(t\\,${String(sec)})`;
    });
    const selectExpr = timeExprs.join('+');

    args.push(
      '-vf', `select='${selectExpr}',scale=${String(width)}:-2`,
      '-vsync', 'vfr',
      '-frames:v', String(options.timestamps.length),
    );
  } else {
    // Evenly spaced frames, skipping first and last 5%
    const startTime = probe.duration * 0.05;
    const endTime = probe.duration * 0.95;
    const usableDuration = endTime - startTime;
    const totalFrames = Math.round(probe.fps * probe.duration);
    const frameInterval = Math.max(1, Math.floor(totalFrames / count));

    // Calculate start frame (5% in)
    const startFrame = Math.floor(totalFrames * 0.05);

    args.push(
      '-vf',
      `select='not(mod(n-${String(startFrame)}\\,${String(frameInterval)}))*gte(t\\,${String(startTime)})*lte(t\\,${String(endTime)})',scale=${String(width)}:-2,setpts=N/TB`,
      '-vsync', 'vfr',
      '-frames:v', String(count),
    );
  }

  // Output format quality
  if (format === 'jpg') {
    args.push('-q:v', '2'); // High quality JPEG
  } else if (format === 'webp') {
    args.push('-quality', '85');
  }
  // PNG uses default (lossless)

  args.push(outputPattern);

  return args;
}
