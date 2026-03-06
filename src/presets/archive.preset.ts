import type { PresetDefinition } from './index.js';

/**
 * Archive preset — near-lossless encoding.
 * Target: Long-term storage, master files.
 */
export const archivePreset: PresetDefinition = {
  name: 'archive',
  description: 'Lossless / near-lossless for storage',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libx264',
    '-crf', '14',                   // Near-lossless quality
    '-preset', 'veryslow',          // Maximum compression efficiency
  ],

  audioArgs: () => [
    '-c:a', 'flac',                 // Lossless audio
  ],

  containerArgs: () => [],
};
