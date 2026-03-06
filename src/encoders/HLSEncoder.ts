import { join } from 'node:path';
import type { HLSOptions } from '../types/options.types.js';
import type { ResolvedResolution } from '../planner/ResolutionResolver.js';
import type { HLSVariant } from '../types/result.types.js';

/**
 * HLS bitrate ladder for automatic bitrate targeting.
 */
const HLS_BITRATE_LADDER: Record<string, { video: number; audio: number }> = {
  '1080p': { video: 4000, audio: 128 },
  '720p':  { video: 2500, audio: 128 },
  '480p':  { video: 1200, audio: 96 },
  '360p':  { video: 700,  audio: 96 },
  '240p':  { video: 400,  audio: 64 },
};

/**
 * Get the target bitrate for a resolution.
 */
function getBitrateForResolution(name: string): { video: number; audio: number } {
  return HLS_BITRATE_LADDER[name] ?? { video: 2500, audio: 128 };
}

/**
 * Build FFmpeg HLS encoding arguments for a single variant.
 *
 * @param resolution - The resolved resolution for this variant
 * @param options - HLS configuration
 * @param outputDir - Absolute output directory for this variant
 * @param variantName - Name for the variant (e.g. '720p')
 * @returns FFmpeg CLI argument array
 */
export function buildHLSArgs(
  resolution: ResolvedResolution,
  options: HLSOptions,
  outputDir: string,
  variantName: string,
): string[] {
  const segmentDuration = options.segmentDuration ?? 6;
  const segmentFormat = options.segmentFormat ?? 'mp4';
  const bitrates = getBitrateForResolution(variantName);

  const segmentExt = segmentFormat === 'ts' ? 'ts' : 'mp4';
  const segmentFilename = join(outputDir, `segment_%03d.${segmentExt}`);
  const playlistPath = join(outputDir, 'stream.m3u8');

  const args: string[] = [
    '-vf', `scale=${resolution.scaleFilter}`,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-b:v', `${String(bitrates.video)}k`,
    '-maxrate', `${String(Math.round(bitrates.video * 1.5))}k`, // 1.5× target for ABR
    '-bufsize', `${String(Math.round(bitrates.video * 1.5))}k`,
    '-c:a', 'aac',
    '-b:a', `${String(bitrates.audio)}k`,
    '-f', 'hls',
    '-hls_time', String(segmentDuration),
    '-hls_list_size', '0',         // Keep all segments in playlist
    '-hls_segment_filename', segmentFilename,
  ];

  // fMP4 segments (modern HLS, default) vs legacy .ts
  if (segmentFormat === 'mp4') {
    args.push('-hls_segment_type', 'fmp4');
  }

  args.push(playlistPath);

  return args;
}

/**
 * Generate an HLS master playlist (M3U8) string from variant information.
 *
 * @param variants - All HLS variant streams
 * @returns The master playlist content as a string
 */
export function generateMasterPlaylist(variants: HLSVariant[]): string {
  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    '',
  ];

  for (const variant of variants) {
    const resolution = variant.resolution;
    const bandwidth = variant.bandwidth;

    // Calculate resolution dimensions from the label
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${String(bandwidth)},RESOLUTION=${resolution},CODECS="avc1.640028,mp4a.40.2"`,
    );
    lines.push(`${resolution.split('x')[0] ?? resolution}/stream.m3u8`);
    lines.push('');
  }

  return lines.join('\n');
}
