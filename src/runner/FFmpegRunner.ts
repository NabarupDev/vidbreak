import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { unlink } from 'node:fs/promises';
import { EncodingError } from '../errors/EncodingError.js';
import { ProgressParser } from './ProgressParser.js';
import type { FFmpegJob } from '../types/job.types.js';
import type { ProgressEvent } from '../types/events.types.js';

export interface RunFFmpegOptions {
  /** Path to the FFmpeg binary */
  binary: string;

  /** FFmpeg CLI arguments */
  args: string[];

  /** The job being executed */
  job: FFmpegJob;

  /** Source video duration in seconds (for progress calculation) */
  duration: number;

  /** Called on each progress update */
  onProgress?: (event: ProgressEvent) => void;

  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Spawn an FFmpeg process, stream progress events, and handle errors.
 */
export async function runFFmpeg(options: RunFFmpegOptions): Promise<void> {
  const { binary, args, job, duration, onProgress, signal } = options;

  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    const parser = new ProgressParser({
      duration,
      jobId: job.id,
      label: job.label,
    });

    // Circular buffer for error reporting (last 50 lines)
    const stderrLines: string[] = [];
    const MAX_STDERR_LINES = 50;

    const rl = createInterface({ input: child.stderr });

    rl.on('line', (line: string) => {
      // Maintain circular buffer
      stderrLines.push(line);
      if (stderrLines.length > MAX_STDERR_LINES) {
        stderrLines.shift();
      }

      // Parse progress
      const progress = parser.parseLine(line);
      if (progress && onProgress) {
        onProgress(progress);
      }
    });

    // Handle abort signal
    const onAbort = () => {
      child.kill('SIGTERM');
      // Clean up partial output file
      unlink(job.outputPath).catch(() => {
        // Ignore errors on cleanup — file may not exist yet
      });
    };

    if (signal) {
      if (signal.aborted) {
        child.kill('SIGTERM');
        reject(new EncodingError({
          jobId: job.id,
          jobLabel: job.label,
          exitCode: -1,
          stderr: 'Job was aborted before starting.',
        }));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    child.on('error', (err) => {
      signal?.removeEventListener('abort', onAbort);
      reject(new EncodingError({
        jobId: job.id,
        jobLabel: job.label,
        exitCode: -1,
        stderr: err.message,
      }));
    });

    child.on('close', (exitCode) => {
      signal?.removeEventListener('abort', onAbort);

      if (signal?.aborted) {
        reject(new EncodingError({
          jobId: job.id,
          jobLabel: job.label,
          exitCode: exitCode ?? -1,
          stderr: 'Job was aborted.',
        }));
        return;
      }

      if (exitCode !== 0) {
        reject(new EncodingError({
          jobId: job.id,
          jobLabel: job.label,
          exitCode: exitCode ?? -1,
          stderr: stderrLines.join('\n'),
        }));
        return;
      }

      // Emit final 100% progress
      if (onProgress) {
        onProgress({
          jobId: job.id,
          label: job.label,
          percent: 100,
          fps: 0,
          speed: 0,
          eta: 0,
          currentSize: 0,
        });
      }

      resolve();
    });
  });
}
