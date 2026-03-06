import type { EncodingError } from '../errors/EncodingError.js';
import type { VideoProbe } from './probe.types.js';

/**
 * Describes a single output file produced by vidbreak.
 */
export interface OutputFile {
  /** Type of rendered output */
  type: 'video' | 'audio' | 'thumbnail';

  /** Output format, e.g. 'mp4', 'mp3', 'jpg' */
  format: string;

  /** Resolution label, e.g. '1080p', '720p' */
  resolution?: string;

  /** Absolute path to the output file */
  path: string;

  /** File size in bytes */
  size: number;

  /** Bitrate in kbps (video/audio only) */
  bitrate?: number;

  /** Duration in seconds (video/audio only) */
  duration?: number;

  /** Width in pixels (video/thumbnail) */
  width?: number;

  /** Height in pixels (video/thumbnail) */
  height?: number;
}

/**
 * Describes an HLS variant stream.
 */
export interface HLSVariant {
  /** Resolution label, e.g. '720p' */
  resolution: string;

  /** Bandwidth in bits/s */
  bandwidth: number;

  /** Absolute path to the variant .m3u8 playlist */
  playlist: string;

  /** Absolute paths to all segment files */
  segments: string[];
}

/**
 * HLS output result.
 */
export interface HLSResult {
  /** Absolute path to the master.m3u8 playlist */
  masterPlaylist: string;

  /** All HLS variant streams */
  variants: HLSVariant[];
}

/**
 * The complete result returned by vidbreak.
 */
export interface VidbreakResult {
  /** Whether all jobs completed without error */
  success: boolean;

  /** Total elapsed time in milliseconds */
  duration: number;

  /** All generated output files */
  files: OutputFile[];

  /** HLS-specific output, if generated */
  hls?: HLSResult;

  /** Partial failures — present even on success if some jobs failed */
  errors: EncodingError[];

  /** Input video metadata from ffprobe */
  probe: VideoProbe;
}
