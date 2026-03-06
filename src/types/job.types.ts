/**
 * The type of an FFmpeg job.
 */
export type JobType = 'video' | 'audio' | 'hls' | 'thumbnail';

/**
 * Internal representation of an FFmpeg job.
 */
export interface FFmpegJob {
  /** Unique job identifier */
  id: string;

  /** Category of encoding work */
  type: JobType;

  /** Absolute path to the input file */
  inputPath: string;

  /** Absolute path to the output file */
  outputPath: string;

  /** Complete FFmpeg CLI args (not including binary path) */
  args: string[];

  /** Human-readable label for progress display */
  label: string;

  /** Weight hint for progress calculation (1-10) */
  estimatedWeight: number;
}
