import { VidbreakError } from './VidbreakError.js';

/**
 * Thrown when ffprobe fails to analyze the input file.
 */
export class ProbeError extends VidbreakError {
  /** The input path that failed probing */
  public readonly inputPath: string;

  /** ffprobe stderr output */
  public readonly stderr: string;

  constructor(inputPath: string, stderr: string) {
    super(
      `Failed to probe "${inputPath}". Ensure the file exists and is a valid media file.\n\nffprobe output:\n${stderr}`,
      'PROBE_FAILED',
    );
    this.name = 'ProbeError';
    this.inputPath = inputPath;
    this.stderr = stderr;
  }
}
