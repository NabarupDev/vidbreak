import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  VidbreakOptions,
  VideoFormat,
  Resolution,
  PresetName,
  HLSOptions,
  AudioOptions,
  ThumbnailOptions,
  HWAccelOptions,
} from '../types/options.types.js';
import type { VidbreakResult } from '../types/result.types.js';
import type { ProgressEvent, JobStartEvent, JobDoneEvent, JobErrorEvent } from '../types/events.types.js';
import { locateBinaries } from '../runner/BinaryLocator.js';
import { probeVideo } from '../utils/probeVideo.js';
import { ensureDir } from '../utils/ensureDir.js';
import { planJobs } from '../planner/JobPlanner.js';
import { runJobsWithConcurrency } from '../scheduler/ConcurrencyScheduler.js';
import { collectResults } from '../runner/OutputCollector.js';
import { generateMasterPlaylist } from '../encoders/HLSEncoder.js';

/**
 * Fluent builder for configuring and running video processing jobs.
 * Extends EventEmitter for typed progress/status events.
 */
export class VidbreakBuilder extends EventEmitter {
  private readonly inputPath: string;
  private readonly options: VidbreakOptions = {};

  constructor(input: string) {
    super();
    this.inputPath = input;
  }

  /** Set the output directory */
  output(dir: string): this {
    this.options.output = dir;
    return this;
  }

  /** Set output video formats */
  format(...formats: VideoFormat[]): this {
    this.options.formats = formats;
    return this;
  }

  /** Set target resolutions */
  resolution(...resolutions: Resolution[]): this {
    this.options.resolutions = resolutions;
    return this;
  }

  /** Set encoding preset */
  preset(name: PresetName): this {
    this.options.preset = name;
    return this;
  }

  /** Configure HLS output */
  hls(options?: boolean | HLSOptions): this {
    this.options.hls = options ?? true;
    return this;
  }

  /** Configure audio extraction */
  audio(options?: boolean | AudioOptions): this {
    this.options.audio = options ?? true;
    return this;
  }

  /** Configure thumbnail generation */
  thumbnails(options?: boolean | ThumbnailOptions): this {
    this.options.thumbnails = options ?? true;
    return this;
  }

  /** Set maximum concurrent FFmpeg processes */
  maxConcurrent(n: number): this {
    this.options.maxConcurrent = n;
    return this;
  }

  /** Configure hardware acceleration */
  hwAccel(options: boolean | 'auto' | HWAccelOptions): this {
    if (options === 'auto') {
      this.options.hwAccel = { backend: 'auto' };
    } else {
      this.options.hwAccel = options;
    }
    return this;
  }

  /** Set FFmpeg binary path */
  ffmpegPath(path: string): this {
    this.options.ffmpegPath = path;
    return this;
  }

  /** Enable fail-fast mode */
  failFast(enabled = true): this {
    this.options.failFast = enabled;
    return this;
  }

  /** Add extra FFmpeg args to every job */
  extraArgs(...args: string[]): this {
    this.options.extraArgs = args;
    return this;
  }

  // Typed event emitter overrides
  override on(event: 'progress', listener: (e: ProgressEvent) => void): this;
  override on(event: 'job:start', listener: (e: JobStartEvent) => void): this;
  override on(event: 'job:done', listener: (e: JobDoneEvent) => void): this;
  override on(event: 'job:error', listener: (e: JobErrorEvent) => void): this;
  override on(event: 'done', listener: (result: VidbreakResult) => void): this;
  override on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Execute the configured video processing pipeline.
   *
   * 1. Locate FFmpeg/FFprobe binaries
   * 2. Probe input video
   * 3. Create output directory
   * 4. Plan jobs
   * 5. Run jobs with scheduler
   * 6. Collect results
   * 7. Emit 'done' event
   */
  async run(): Promise<VidbreakResult> {
    const startTime = Date.now();

    // 1. Locate binaries
    const locateOpts: { ffmpegPath?: string; ffprobePath?: string } = {};
    if (this.options.ffmpegPath) locateOpts.ffmpegPath = this.options.ffmpegPath;
    if (this.options.ffprobePath) locateOpts.ffprobePath = this.options.ffprobePath;
    const binaries = await locateBinaries(locateOpts);

    // 2. Probe input
    const probe = await probeVideo(this.inputPath, binaries.ffprobe);

    // 3. Ensure output directory
    const outputDir = resolve(this.options.output ?? './vidbreak-out');
    await ensureDir(outputDir);

    // Also ensure sub-directories for audio, thumbnails, HLS
    if (this.options.audio) {
      const audioOpts = this.options.audio === true ? {} : this.options.audio;
      await ensureDir(join(outputDir, audioOpts.outputDir ?? 'audio'));
    }
    if (this.options.thumbnails) {
      const thumbOpts = this.options.thumbnails === true ? {} : this.options.thumbnails;
      await ensureDir(join(outputDir, thumbOpts.outputDir ?? 'thumbnails'));
    }
    if (this.options.hls) {
      const hlsOpts = this.options.hls === true ? {} : this.options.hls;
      const hlsDir = join(outputDir, hlsOpts.outputDir ?? 'hls');
      await ensureDir(hlsDir);

      // Create variant directories
      const { resolveResolutions } = await import('../planner/ResolutionResolver.js');
      const hlsResolutions = resolveResolutions(
        hlsOpts.resolutions ?? this.options.resolutions ?? ['original'],
        probe,
      );
      for (const res of hlsResolutions) {
        await ensureDir(join(hlsDir, res.name));
      }
    }

    // 4. Plan jobs
    const jobs = planJobs(this.inputPath, this.options, probe, binaries, outputDir);

    // 5. Run with scheduler
    const { completed, errors } = await runJobsWithConcurrency(jobs, {
      maxConcurrent: this.options.maxConcurrent ?? 2,
      binaries,
      duration: probe.duration,
      onProgress: (event) => {
        this.emit('progress', event);
      },
      onJobStart: (job) => {
        this.emit('job:start', {
          jobId: job.id,
          label: job.label,
          outputPath: job.outputPath,
        } satisfies JobStartEvent);
      },
      onJobDone: (job) => {
        this.emit('job:done', {
          jobId: job.id,
          label: job.label,
          outputPath: job.outputPath,
        } satisfies JobDoneEvent);
      },
      onJobError: (job, error) => {
        this.emit('job:error', {
          jobId: job.id,
          label: job.label,
          error,
        } satisfies JobErrorEvent);
      },
      failFast: this.options.failFast ?? false,
    });

    // 6. Collect results
    const result = await collectResults(completed, errors, probe, startTime);

    // Generate HLS master playlist if we have variants
    if (result.hls && result.hls.variants.length > 0) {
      const masterContent = generateMasterPlaylist(result.hls.variants);
      await writeFile(result.hls.masterPlaylist, masterContent, 'utf-8');
    }

    // 7. Emit 'done'
    this.emit('done', result);

    return result;
  }
}
