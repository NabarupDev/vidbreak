import type { ProgressEvent } from '../types/events.types.js';
import { timeToSeconds } from '../utils/timeToSeconds.js';

/**
 * Parses FFmpeg's stderr output line-by-line into typed ProgressEvent objects.
 */
export class ProgressParser {
  private readonly duration: number;
  private readonly jobId: string;
  private readonly label: string;

  constructor(config: {
    duration: number;
    jobId: string;
    label: string;
  }) {
    this.duration = config.duration;
    this.jobId = config.jobId;
    this.label = config.label;
  }

  /**
   * Parse a single line of FFmpeg stderr.
   * Returns a ProgressEvent if the line contains progress info, null otherwise.
   */
  parseLine(line: string): ProgressEvent | null {
    // Only parse lines containing both frame= and time=
    if (!line.includes('frame=') || !line.includes('time=')) {
      return null;
    }

    const fpsMatch = /fps=\s*(\d+\.?\d*)/.exec(line);
    const timeMatch = /time=(\d{2}:\d{2}:\d{2}\.\d{2})/.exec(line);
    const speedMatch = /speed=\s*(\d+\.?\d*)x/.exec(line);
    const sizeMatch = /size=\s*(\d+)kB/.exec(line);

    if (!timeMatch?.[1]) {
      return null;
    }

    const parsedSeconds = timeToSeconds(timeMatch[1]);
    const fps = fpsMatch?.[1] ? parseFloat(fpsMatch[1]) : 0;
    const speed = speedMatch?.[1] ? parseFloat(speedMatch[1]) : 1;
    const currentSize = sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) * 1024 : 0;

    const percent = this.duration > 0
      ? Math.min(100, (parsedSeconds / this.duration) * 100)
      : 0;

    const eta = speed > 0
      ? (this.duration - parsedSeconds) / speed
      : 0;

    return {
      jobId: this.jobId,
      label: this.label,
      percent: Math.round(percent * 100) / 100,
      fps,
      speed,
      eta: Math.max(0, eta),
      currentSize,
    };
  }
}
