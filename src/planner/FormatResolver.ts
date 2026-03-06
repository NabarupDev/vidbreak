import type { VideoFormat } from '../types/options.types.js';

/**
 * Format → default codec/container info for resolving presets per format.
 */
interface FormatCodecInfo {
  videoCodec: string;
  audioCodec: string;
  container: string;
}

const FORMAT_CODEC_MAP: Record<VideoFormat, FormatCodecInfo> = {
  mp4:        { videoCodec: 'libx264',    audioCodec: 'aac',      container: 'mp4' },
  webm:       { videoCodec: 'libvpx-vp9', audioCodec: 'libopus',  container: 'webm' },
  av1:        { videoCodec: 'libaom-av1', audioCodec: 'libopus',  container: 'mp4' },
  mkv:        { videoCodec: 'libx265',    audioCodec: 'aac',      container: 'mkv' },
  mov:        { videoCodec: 'libx264',    audioCodec: 'aac',      container: 'mov' },
  gif:        { videoCodec: 'gif',        audioCodec: '',         container: 'gif' },
  'mp4-hevc': { videoCodec: 'libx265',    audioCodec: 'aac',      container: 'mp4' },
};

/**
 * Get codec information for a given video format.
 */
export function getFormatCodecInfo(format: VideoFormat): FormatCodecInfo {
  return FORMAT_CODEC_MAP[format];
}
