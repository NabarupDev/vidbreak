import type { PresetDefinition } from './index.js';

/**
 * HQ preset — high quality H.265 encoding.
 * Target: Modern devices where file size matters (streaming, VOD).
 */
export const hqPreset: PresetDefinition = {
  name: 'hq',
  description: 'High quality, smaller files (H.265/HEVC)',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libx265',
    '-crf', '28',                   // Equivalent visual quality to H.264 CRF 23, ~40% smaller
    '-preset', 'medium',
    '-tag:v', 'hvc1',               // Required for H.265 in MP4 to play on Apple devices
    '-pix_fmt', 'yuv420p',
  ],

  audioArgs: () => [
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',                 // 48kHz matches broadcast/streaming standards
  ],

  containerArgs: () => [
    '-movflags', '+faststart',
  ],
};
