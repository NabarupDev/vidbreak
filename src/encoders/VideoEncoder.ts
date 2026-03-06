import type { VideoFormat } from '../types/options.types.js';
import type { PresetDefinition } from '../presets/index.js';
import type { ResolvedResolution } from '../planner/ResolutionResolver.js';

/**
 * Map of format → container extension.
 */
const FORMAT_EXTENSION_MAP: Record<VideoFormat, string> = {
  'mp4': 'mp4',
  'webm': 'webm',
  'av1': 'mp4',
  'mkv': 'mkv',
  'mov': 'mov',
  'gif': 'gif',
  'mp4-hevc': 'mp4',
};

/**
 * Get the file extension for a video format.
 */
export function getFormatExtension(format: VideoFormat): string {
  return FORMAT_EXTENSION_MAP[format];
}

/**
 * Build FFmpeg video encoding arguments for a given resolution and preset.
 *
 * @returns FFmpeg CLI argument array (not including binary or I/O args)
 */
export function buildVideoArgs(
  resolution: ResolvedResolution,
  preset: PresetDefinition,
  _format: VideoFormat,
): string[] {
  return [
    ...preset.videoArgs(resolution.scaleFilter),
    ...preset.audioArgs(),
    ...preset.containerArgs(),
  ];
}
