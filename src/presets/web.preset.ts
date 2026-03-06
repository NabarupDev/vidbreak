import type { PresetDefinition } from './index.js';

/**
 * Web preset — broadest compatibility (H.264 + AAC).
 * Target: 90% of viewers on any device/browser.
 */
export const webPreset: PresetDefinition = {
  name: 'web',
  description: 'Optimised for broad browser/device compatibility (H.264 + AAC)',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libx264',
    '-crf', '23',                   // Industry standard for near-transparent quality
    '-preset', 'medium',            // Balanced speed vs compression efficiency
    '-profile:v', 'high',           // Compatible with all modern devices
    '-level', '4.0',                // Supports up to 1080p30 on smart TVs
    '-pix_fmt', 'yuv420p',          // Forces 8-bit 4:2:0 for maximum player compat
  ],

  audioArgs: () => [
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
  ],

  containerArgs: () => [
    '-movflags', '+faststart',      // Moves moov atom to start for instant web playback
  ],
};
