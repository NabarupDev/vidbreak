import pLimit from 'p-limit';
import type { FFmpegJob } from '../types/job.types.js';
import type { ProgressEvent } from '../types/events.types.js';
import type { BinaryPaths } from '../runner/BinaryLocator.js';
import type { EncodingError } from '../errors/EncodingError.js';
import { runFFmpeg, type RunFFmpegOptions } from '../runner/FFmpegRunner.js';

export interface SchedulerOptions {
  /** Maximum concurrent non-HLS jobs */
  maxConcurrent: number;

  /** FFmpeg/FFprobe binary paths */
  binaries: BinaryPaths;

  /** Source video duration in seconds */
  duration: number;

  /** Progress callback */
  onProgress?: (event: ProgressEvent) => void;

  /** Called when a job begins */
  onJobStart?: (job: FFmpegJob) => void;

  /** Called when a job finishes */
  onJobDone?: (job: FFmpegJob) => void;

  /** Called when a job fails */
  onJobError?: (job: FFmpegJob, error: EncodingError) => void;

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Abort on first failure */
  failFast: boolean;
}

export interface SchedulerResult {
  completed: FFmpegJob[];
  errors: EncodingError[];
}

/**
 * Execute FFmpeg jobs with bounded concurrency.
 * HLS jobs always run serialised (single concurrency).
 * Non-HLS jobs respect the maxConcurrent limit.
 */
export async function runJobsWithConcurrency(
  jobs: FFmpegJob[],
  options: SchedulerOptions,
): Promise<SchedulerResult> {
  const completed: FFmpegJob[] = [];
  const errors: EncodingError[] = [];

  const abortController = options.signal
    ? undefined
    : new AbortController();
  const signal = options.signal ?? abortController?.signal;

  const hlsJobs = jobs.filter((j) => j.type === 'hls');
  const nonHlsJobs = jobs.filter((j) => j.type !== 'hls');

  const limit = pLimit(options.maxConcurrent);
  const hlsLimit = pLimit(1); // HLS jobs always serialised

  const executeJob = async (job: FFmpegJob, limiter: ReturnType<typeof pLimit>): Promise<void> => {
    return limiter(async () => {
      if (signal?.aborted) return;

      options.onJobStart?.(job);

      try {
        const runOpts: RunFFmpegOptions = {
          binary: options.binaries.ffmpeg,
          args: job.args,
          job,
          duration: options.duration,
        };
        if (options.onProgress) runOpts.onProgress = options.onProgress;
        if (signal) runOpts.signal = signal;
        await runFFmpeg(runOpts);

        completed.push(job);
        options.onJobDone?.(job);
      } catch (err: unknown) {
        const encodingError = err as EncodingError;
        errors.push(encodingError);
        options.onJobError?.(job, encodingError);

        if (options.failFast) {
          abortController?.abort();
        }
      }
    });
  };

  // Run non-HLS jobs with concurrency limit
  const nonHlsPromises = nonHlsJobs.map((job) => executeJob(job, limit));

  // Run HLS jobs serialised
  const hlsPromises = hlsJobs.map((job) => executeJob(job, hlsLimit));

  // Wait for all jobs
  await Promise.allSettled([...nonHlsPromises, ...hlsPromises]);

  return { completed, errors };
}
