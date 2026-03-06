import type { AudioFormat, AudioOptions } from '../types/options.types.js';

/**
 * Audio format → FFmpeg codec flags mapping.
 */
const AUDIO_FORMAT_FLAGS: Record<AudioFormat, string[]> = {
  mp3:  ['-codec:a', 'libmp3lame', '-q:a', '2'],        // VBR ~190kbps
  aac:  ['-codec:a', 'aac', '-b:a', '192k'],
  opus: ['-codec:a', 'libopus', '-b:a', '160k', '-vbr', 'on'],
  flac: ['-codec:a', 'flac'],
  wav:  ['-codec:a', 'pcm_s16le'],
  ogg:  ['-codec:a', 'libvorbis', '-q:a', '6'],
};

/**
 * Build FFmpeg audio extraction arguments.
 *
 * @param format - Target audio format
 * @param options - Audio extraction options
 * @returns FFmpeg CLI argument array
 */
export function buildAudioArgs(
  format: AudioFormat,
  options: AudioOptions,
): string[] {
  const args: string[] = [
    '-vn', // No video output — audio extraction only
  ];

  const formatFlags = AUDIO_FORMAT_FLAGS[format];
  args.push(...formatFlags);

  // Override bitrate if specified
  if (options.bitrate) {
    // Find and replace the bitrate flag
    const bitrateIndex = args.indexOf('-b:a');
    if (bitrateIndex !== -1) {
      args[bitrateIndex + 1] = options.bitrate;
    }

    const qualityIndex = args.indexOf('-q:a');
    if (qualityIndex !== -1 && format === 'mp3') {
      // For MP3, if bitrate is explicitly set, switch to CBR
      args.splice(qualityIndex, 2);
      args.push('-b:a', options.bitrate);
    }
  }

  // EBU R128 loudness normalization
  if (options.normalize) {
    args.push('-af', 'loudnorm=I=-14:TP=-1:LRA=11');
  }

  return args;
}

/**
 * Map audio format to file extension.
 */
export function getAudioExtension(format: AudioFormat): string {
  if (format === 'ogg') return 'ogg';
  return format;
}
