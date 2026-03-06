/**
 * Video output format supported by vidbreak.
 */
export type VideoFormat =
  | 'mp4'       // H.264 + AAC — widest compatibility
  | 'webm'      // VP9 + Opus — open web standard
  | 'av1'       // AV1 + Opus — next-gen compression
  | 'mkv'       // H.265 + AAC — archival quality
  | 'mov'       // ProRes/H.264 — Apple ecosystem
  | 'gif'       // Animated GIF — legacy web use
  | 'mp4-hevc'; // H.265 in MP4 — modern devices

/**
 * Named resolution shorthand.
 */
export type NamedResolution =
  | '4k'       // 3840×2160
  | '2k'       // 2560×1440
  | '1080p'    // 1920×1080
  | '720p'     // 1280×720
  | '480p'     // 854×480
  | '360p'     // 640×360
  | '240p'     // 426×240
  | 'original'; // Preserve source resolution

/**
 * Custom resolution in WxH format, e.g. '1920x1080'.
 */
export type CustomResolution = `${number}x${number}`;

/**
 * Resolution — either a named shorthand or a custom WxH string.
 */
export type Resolution = NamedResolution | CustomResolution;

/**
 * Audio output format for extraction.
 */
export type AudioFormat = 'mp3' | 'aac' | 'opus' | 'flac' | 'wav' | 'ogg';

/**
 * Encoding preset name.
 */
export type PresetName =
  | 'web'      // Optimised for broad browser/device compatibility
  | 'hq'       // High quality, larger files (H.265)
  | 'av1'      // AV1 — best compression, slow encode
  | 'webm'     // Open formats only (VP9 + Opus)
  | 'fast'     // Speed-optimised (lower quality, smaller file)
  | 'archive'  // Lossless / near-lossless for storage
  | 'mobile';  // Optimised for mobile bandwidth constraints

/**
 * HLS adaptive streaming output configuration.
 */
export interface HLSOptions {
  /**
   * Segment duration in seconds.
   * @default 6
   */
  segmentDuration?: number;

  /**
   * Resolutions to include in the adaptive stream.
   * Defaults to the same as the top-level `resolutions` option.
   */
  resolutions?: Resolution[];

  /**
   * Video format for HLS segments.
   * @default 'mp4' (fMP4 segments — modern HLS)
   */
  segmentFormat?: 'ts' | 'mp4';

  /**
   * Output directory for HLS files, relative to main output.
   * @default 'hls'
   */
  outputDir?: string;

  /**
   * Generate a master playlist automatically.
   * @default true
   */
  masterPlaylist?: boolean;
}

/**
 * Audio extraction configuration.
 */
export interface AudioOptions {
  /**
   * Output audio formats to extract.
   * @default ['mp3']
   */
  formats?: AudioFormat[];

  /**
   * Audio bitrate.
   * @default '192k'
   */
  bitrate?: string;

  /**
   * Normalize audio volume using EBU R128.
   * @default false
   */
  normalize?: boolean;

  /**
   * Output directory for audio files, relative to main output.
   * @default 'audio'
   */
  outputDir?: string;
}

/**
 * Thumbnail generation configuration.
 */
export interface ThumbnailOptions {
  /**
   * Number of thumbnails to generate, evenly spaced.
   * @default 3
   */
  count?: number;

  /**
   * Specific timestamps to capture, in seconds or 'HH:MM:SS'.
   * Overrides `count` if provided.
   */
  timestamps?: Array<number | string>;

  /**
   * Thumbnail output format.
   * @default 'jpg'
   */
  format?: 'jpg' | 'png' | 'webp';

  /**
   * Thumbnail width in pixels. Height auto-scales.
   * @default 320
   */
  width?: number;

  /**
   * Output directory for thumbnails, relative to main output.
   * @default 'thumbnails'
   */
  outputDir?: string;
}

/**
 * Hardware acceleration configuration.
 */
export interface HWAccelOptions {
  /**
   * Hardware acceleration backend.
   * 'auto' attempts to detect the best option for the current system.
   */
  backend: 'auto' | 'nvenc' | 'vaapi' | 'videotoolbox' | 'qsv';

  /**
   * Device path for VAAPI.
   * @default '/dev/dri/renderD128'
   */
  device?: string;
}

/**
 * Top-level options for the vidbreak function.
 */
export interface VidbreakOptions {
  /**
   * Output directory path.
   * @default './vidbreak-out'
   */
  output?: string;

  /**
   * Output video formats to generate.
   * @default ['mp4']
   */
  formats?: VideoFormat[];

  /**
   * Target resolutions. Filters out any resolution larger than the source.
   * @default ['original']
   */
  resolutions?: Resolution[];

  /**
   * Encoding preset name. Overrides per-format codec defaults.
   */
  preset?: PresetName;

  /**
   * HLS adaptive streaming output configuration.
   * Set to `true` for defaults, or pass HLSOptions.
   */
  hls?: boolean | HLSOptions;

  /**
   * Audio extraction configuration.
   * Set to `true` for MP3 defaults, or pass AudioOptions.
   */
  audio?: boolean | AudioOptions;

  /**
   * Thumbnail generation configuration.
   * Set to `true` for 3 JPEG thumbnails, or pass ThumbnailOptions.
   */
  thumbnails?: boolean | ThumbnailOptions;

  /**
   * Maximum number of concurrent FFmpeg processes.
   * @default 2
   */
  maxConcurrent?: number;

  /**
   * Override the FFmpeg binary path.
   */
  ffmpegPath?: string;

  /**
   * Override the ffprobe binary path.
   */
  ffprobePath?: string;

  /**
   * Enable hardware acceleration where available.
   * @default false
   */
  hwAccel?: boolean | HWAccelOptions;

  /**
   * Called on each progress update across all jobs.
   */
  onProgress?: (event: import('./events.types.js').ProgressEvent) => void;

  /**
   * If true, vidbreak throws on the first job failure instead of collecting errors.
   * @default false
   */
  failFast?: boolean;

  /**
   * Additional raw FFmpeg args appended to every job.
   */
  extraArgs?: string[];
}
