import { VidbreakError } from './VidbreakError.js';

/**
 * Thrown when an FFmpeg encoding job fails.
 */
export class EncodingError extends VidbreakError {
  /** The job that failed */
  public readonly jobId: string;

  /** Human-readable job label */
  public readonly jobLabel: string;

  /** FFmpeg process exit code */
  public readonly exitCode: number;

  /** Last 20 lines of FFmpeg stderr output */
  public readonly stderr: string;

  constructor(options: {
    jobId: string;
    jobLabel: string;
    exitCode: number;
    stderr: string;
  }) {
    const stderrLines = options.stderr.split('\n');
    const lastLines = stderrLines.slice(-20).join('\n');

    super(
      `Encoding failed for "${options.jobLabel}" (exit code ${String(options.exitCode)}).\n\nFFmpeg output (last 20 lines):\n${lastLines}`,
      'ENCODING_FAILED',
    );
    this.name = 'EncodingError';
    this.jobId = options.jobId;
    this.jobLabel = options.jobLabel;
    this.exitCode = options.exitCode;
    this.stderr = lastLines;
  }
}
