import type { EncodingError } from '../errors/EncodingError.js';

/**
 * Progress update from an active FFmpeg job.
 */
export interface ProgressEvent {
  /** Job identifier */
  jobId: string;

  /** Human-readable label for the job */
  label: string;

  /** Encoding progress percentage (0-100) */
  percent: number;

  /** Current frames per second */
  fps: number;

  /** Encoding speed multiplier (e.g. 2.0 = 2× realtime) */
  speed: number;

  /** Estimated time remaining in seconds */
  eta: number;

  /** Current output file size in bytes */
  currentSize: number;
}

/**
 * Emitted when an FFmpeg job starts.
 */
export interface JobStartEvent {
  /** Job identifier */
  jobId: string;

  /** Human-readable label for the job */
  label: string;

  /** Absolute path to the output file */
  outputPath: string;
}

/**
 * Emitted when an FFmpeg job completes.
 */
export interface JobDoneEvent {
  /** Job identifier */
  jobId: string;

  /** Human-readable label for the job */
  label: string;

  /** Absolute path to the output file */
  outputPath: string;
}

/**
 * Emitted when an FFmpeg job fails.
 */
export interface JobErrorEvent {
  /** Job identifier */
  jobId: string;

  /** Human-readable label for the job */
  label: string;

  /** The encoding error */
  error: EncodingError;
}
