import type { PresetDefinition } from './index.js';

/**
 * Fast preset — speed-optimised encoding.
 * Target: Development, previews, quick-turnaround transcodes.
 */
export const fastPreset: PresetDefinition = {
  name: 'fast',
  description: 'Speed-optimised (lower quality, smaller file)',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'ultrafast',         // Fastest possible encoding
  ],

  audioArgs: () => [
    '-c:a', 'aac',
    '-b:a', '96k',
  ],

  containerArgs: () => [
    '-movflags', '+faststart',
  ],
};
