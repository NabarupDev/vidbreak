import type { VidbreakOptions } from './types/options.types.js';
import type { VidbreakResult } from './types/result.types.js';
import { VidbreakBuilder } from './builder/VidbreakBuilder.js';

/**
 * The simplest way to use vidbreak — a single async function that does everything.
 *
 * @param input - Path to the input video file
 * @param options - Processing options
 * @returns Complete processing result
 */
export async function vidbreak(
  input: string,
  options?: VidbreakOptions,
): Promise<VidbreakResult> {
  const builder = new VidbreakBuilder(input);

  // Apply all options to builder
  if (options?.output) builder.output(options.output);
  if (options?.formats) builder.format(...options.formats);
  if (options?.resolutions) builder.resolution(...options.resolutions);
  if (options?.preset) builder.preset(options.preset);
  if (options?.hls !== undefined) builder.hls(options.hls);
  if (options?.audio !== undefined) builder.audio(options.audio);
  if (options?.thumbnails !== undefined) builder.thumbnails(options.thumbnails);
  if (options?.maxConcurrent) builder.maxConcurrent(options.maxConcurrent);
  if (options?.hwAccel !== undefined) builder.hwAccel(options.hwAccel);
  if (options?.ffmpegPath) builder.ffmpegPath(options.ffmpegPath);
  if (options?.failFast) builder.failFast(options.failFast);
  if (options?.extraArgs) builder.extraArgs(...options.extraArgs);

  // Wire onProgress callback to the 'progress' event
  if (options?.onProgress) {
    builder.on('progress', options.onProgress);
  }

  return builder.run();
}
