# Filename: API_DESIGN.md

# vidbreak — API Design

> Complete TypeScript interface reference for all public APIs

---

## Top-Level Function

### `vidbreak(input, options?)`

The simplest way to use vidbreak — a single async function that does everything.

```ts
import { vidbreak } from 'vidbreak';

const result = await vidbreak(input: string, options?: VidbreakOptions): Promise<VidbreakResult>
```

---

## Core Types

### `VidbreakOptions`

```ts
interface VidbreakOptions {
  /**
   * Output directory path. Defaults to ./vidbreak-out
   */
  output?: string;

  /**
   * Output video formats to generate.
   * @default ['mp4']
   */
  formats?: VideoFormat[];

  /**
   * Target resolutions. Filters out any resolution larger than the source.
   * Accepts named resolutions or WxH strings.
   * @example ['1080p', '720p', '480p', '360p']
   * @example ['1920x1080', '1280x720']
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
   * Auto-detected from PATH or ffmpeg-static if not set.
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
  onProgress?: (event: ProgressEvent) => void;

  /**
   * If true, vidbreak throws on the first job failure instead of collecting errors.
   * @default false
   */
  failFast?: boolean;

  /**
   * Additional raw FFmpeg args appended to every job.
   * Use with caution — may conflict with generated args.
   */
  extraArgs?: string[];
}
```

---

### `VideoFormat`

```ts
type VideoFormat =
  | 'mp4'    // H.264 + AAC  — widest compatibility
  | 'webm'   // VP9 + Opus   — open web standard
  | 'av1'    // AV1 + Opus   — next-gen compression
  | 'mkv'    // H.265 + AAC  — archival quality
  | 'mov'    // ProRes/H.264 — Apple ecosystem
  | 'gif'    // Animated GIF — legacy web use
  | 'mp4-hevc'; // H.265 in MP4 — modern devices
```

---

### `Resolution`

```ts
type NamedResolution =
  | '4k'    // 3840×2160
  | '2k'    // 2560×1440
  | '1080p' // 1920×1080
  | '720p'  // 1280×720
  | '480p'  // 854×480
  | '360p'  // 640×360
  | '240p'  // 426×240
  | 'original'; // Preserve source resolution

type CustomResolution = `${number}x${number}`; // e.g. '1920x1080'

type Resolution = NamedResolution | CustomResolution;
```

---

### `HLSOptions`

```ts
interface HLSOptions {
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
   * Video formats for HLS segments.
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
```

---

### `AudioOptions`

```ts
interface AudioOptions {
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

type AudioFormat = 'mp3' | 'aac' | 'opus' | 'flac' | 'wav' | 'ogg';
```

---

### `ThumbnailOptions`

```ts
interface ThumbnailOptions {
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
```

---

### `HWAccelOptions`

```ts
interface HWAccelOptions {
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
```

---

### `PresetName`

```ts
type PresetName =
  | 'web'      // Optimised for broad browser/device compatibility
  | 'hq'       // High quality, larger files (H.265)
  | 'av1'      // AV1 — best compression, slow encode
  | 'webm'     // Open formats only (VP9 + Opus)
  | 'fast'     // Speed-optimised (lower quality, smaller file)
  | 'archive'  // Lossless / near-lossless for storage
  | 'mobile';  // Optimised for mobile bandwidth constraints
```

---

## Result Types

### `VidbreakResult`

```ts
interface VidbreakResult {
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
```

---

### `OutputFile`

```ts
interface OutputFile {
  type: 'video' | 'audio' | 'thumbnail';
  format: string;           // 'mp4', 'mp3', 'jpg', etc.
  resolution?: string;      // '1080p', '720p', etc.
  path: string;             // Absolute path to the output file
  size: number;             // File size in bytes
  bitrate?: number;         // Bitrate in kbps (video/audio only)
  duration?: number;        // Duration in seconds (video/audio only)
  width?: number;           // Width in pixels (video/thumbnail)
  height?: number;          // Height in pixels (video/thumbnail)
}
```

---

### `HLSResult`

```ts
interface HLSResult {
  masterPlaylist: string;   // Absolute path to master.m3u8
  variants: HLSVariant[];
}

interface HLSVariant {
  resolution: string;
  bandwidth: number;        // bits/s
  playlist: string;         // Absolute path to variant .m3u8
  segments: string[];       // Absolute paths to all .ts or .mp4 segments
}
```

---

## Builder API

For advanced use cases, use the fluent builder:

```ts
import { VidbreakBuilder } from 'vidbreak';

const builder = new VidbreakBuilder('./input.mp4')
  .output('./dist/video')
  .format('mp4', 'webm')
  .resolution('1080p', '720p', '480p')
  .preset('web')
  .hls({ segmentDuration: 4 })
  .audio({ formats: ['mp3', 'aac'], bitrate: '256k' })
  .thumbnails({ count: 5, format: 'webp', width: 480 })
  .maxConcurrent(3)
  .hwAccel('auto');

// Listen to events
builder.on('progress', (e) => {
  process.stdout.write(`\r[${e.label}] ${e.percent.toFixed(1)}%`);
});

builder.on('job:done', (e) => {
  console.log(`✅ ${e.label} → ${e.outputPath}`);
});

builder.on('job:error', (e) => {
  console.error(`❌ ${e.label}: ${e.error.message}`);
});

const result = await builder.run();
```

### Builder Method Signatures

```ts
class VidbreakBuilder extends EventEmitter {
  constructor(input: string)

  output(dir: string): this
  format(...formats: VideoFormat[]): this
  resolution(...resolutions: Resolution[]): this
  preset(name: PresetName): this
  hls(options?: boolean | HLSOptions): this
  audio(options?: boolean | AudioOptions): this
  thumbnails(options?: boolean | ThumbnailOptions): this
  maxConcurrent(n: number): this
  hwAccel(options: boolean | 'auto' | HWAccelOptions): this
  ffmpegPath(path: string): this
  failFast(enabled?: boolean): this
  extraArgs(...args: string[]): this

  run(): Promise<VidbreakResult>

  // EventEmitter events
  on(event: 'progress', listener: (e: ProgressEvent) => void): this
  on(event: 'job:start', listener: (e: JobStartEvent) => void): this
  on(event: 'job:done', listener: (e: JobDoneEvent) => void): this
  on(event: 'job:error', listener: (e: JobErrorEvent) => void): this
  on(event: 'done', listener: (result: VidbreakResult) => void): this
}
```

---

## Utility Exports

```ts
import {
  probeVideo,    // Run ffprobe on any file
  findFFmpeg,    // Locate FFmpeg binary
  listPresets,   // Return all available preset names + descriptions
  formatBytes,   // number → '12.4 MB'
} from 'vidbreak/utils';
```

---

## Error Types

```ts
import {
  VidbreakError,        // Base class
  FFmpegNotFoundError,  // Binary not found
  EncodingError,        // Job-level failure
  ProbeError,           // ffprobe failed on input
} from 'vidbreak/errors';
```
