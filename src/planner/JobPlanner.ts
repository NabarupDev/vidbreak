import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { VidbreakOptions, AudioOptions, ThumbnailOptions, HLSOptions } from '../types/options.types.js';
import type { FFmpegJob } from '../types/job.types.js';
import type { VideoProbe } from '../types/probe.types.js';
import type { BinaryPaths } from '../runner/BinaryLocator.js';
import { resolveResolutions } from './ResolutionResolver.js';
import { getPreset } from '../presets/index.js';
import { buildVideoArgs, getFormatExtension } from '../encoders/VideoEncoder.js';
import { buildAudioArgs, getAudioExtension } from '../encoders/AudioEncoder.js';
import { buildHLSArgs } from '../encoders/HLSEncoder.js';
import { buildThumbnailArgs } from '../encoders/ThumbnailEncoder.js';

/**
 * Convert VidbreakOptions + probe data into an ordered list of FFmpegJobs.
 * Order: video → audio → HLS → thumbnails
 */
export function planJobs(
  inputPath: string,
  options: VidbreakOptions,
  probe: VideoProbe,
  _binaries: BinaryPaths,
  outputDir: string,
): FFmpegJob[] {
  const jobs: FFmpegJob[] = [];
  const presetName = options.preset ?? 'web';
  const preset = getPreset(presetName);
  const formats = options.formats ?? ['mp4'];
  const resolutions = resolveResolutions(options.resolutions ?? ['original'], probe);
  const extraArgs = options.extraArgs ?? [];

  // --- Video jobs ---
  for (const format of formats) {
    for (const resolution of resolutions) {
      const ext = getFormatExtension(format);
      const outputFilename = `${resolution.name}.${ext}`;
      const outputPath = join(outputDir, outputFilename);

      const videoArgs = buildVideoArgs(resolution, preset, format);

      const args = [
        '-i', inputPath,
        ...videoArgs,
        ...extraArgs,
        '-y',  // Overwrite output
        outputPath,
      ];

      jobs.push({
        id: randomUUID(),
        type: 'video',
        inputPath,
        outputPath,
        args,
        label: `${ext.toUpperCase()} ${resolution.name}`,
        estimatedWeight: 5,
      });
    }
  }

  // --- Audio jobs ---
  if (options.audio && probe.hasAudio) {
    const audioOpts: AudioOptions = options.audio === true
      ? { formats: ['mp3'] }
      : options.audio;

    const audioFormats = audioOpts.formats ?? ['mp3'];
    const audioDir = join(outputDir, audioOpts.outputDir ?? 'audio');

    for (const format of audioFormats) {
      const ext = getAudioExtension(format);
      const outputPath = join(audioDir, `audio.${ext}`);

      const audioArgs = buildAudioArgs(format, audioOpts);

      const args = [
        '-i', inputPath,
        ...audioArgs,
        ...extraArgs,
        '-y',
        outputPath,
      ];

      jobs.push({
        id: randomUUID(),
        type: 'audio',
        inputPath,
        outputPath,
        args,
        label: `${ext.toUpperCase()} audio`,
        estimatedWeight: 2,
      });
    }
  }

  // --- HLS jobs ---
  if (options.hls) {
    const hlsOpts: HLSOptions = options.hls === true ? {} : options.hls;
    const hlsResolutions = resolveResolutions(
      hlsOpts.resolutions ?? options.resolutions ?? ['original'],
      probe,
    );
    const hlsBaseDir = join(outputDir, hlsOpts.outputDir ?? 'hls');

    for (const resolution of hlsResolutions) {
      const variantDir = join(hlsBaseDir, resolution.name);
      const playlistPath = join(variantDir, 'stream.m3u8');

      const hlsArgs = buildHLSArgs(resolution, hlsOpts, variantDir, resolution.name);

      // buildHLSArgs includes the output path at the end, so we build differently
      const args = [
        '-i', inputPath,
        ...hlsArgs.slice(0, -1), // Everything except the trailing output path
        ...extraArgs,
        '-y',
        hlsArgs[hlsArgs.length - 1] ?? playlistPath, // The output path
      ];

      jobs.push({
        id: randomUUID(),
        type: 'hls',
        inputPath,
        outputPath: playlistPath,
        args,
        label: `HLS ${resolution.name}`,
        estimatedWeight: 6,
      });
    }
  }

  // --- Thumbnail jobs ---
  if (options.thumbnails) {
    const thumbOpts: ThumbnailOptions = options.thumbnails === true
      ? { count: 3 }
      : options.thumbnails;

    const thumbDir = join(outputDir, thumbOpts.outputDir ?? 'thumbnails');
    const format = thumbOpts.format ?? 'jpg';
    const outputPattern = join(thumbDir, `thumb_%02d.${format}`);

    const thumbArgs = buildThumbnailArgs(thumbOpts, probe, outputPattern);

    // buildThumbnailArgs includes the output pattern at the end
    const args = [
      '-i', inputPath,
      ...thumbArgs.slice(0, -1),
      ...extraArgs,
      thumbArgs[thumbArgs.length - 1] ?? outputPattern,
    ];

    jobs.push({
      id: randomUUID(),
      type: 'thumbnail',
      inputPath,
      outputPath: thumbDir,
      args,
      label: `Thumbnails (${String(thumbOpts.count ?? 3)} × ${format.toUpperCase()})`,
      estimatedWeight: 1,
    });
  }

  return jobs;
}
