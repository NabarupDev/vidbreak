import type { PresetDefinition } from './index.js';

/**
 * Mobile preset — bandwidth-constrained encoding.
 * Target: Mobile data users, developing-world connectivity.
 */
export const mobilePreset: PresetDefinition = {
  name: 'mobile',
  description: 'Optimised for mobile bandwidth constraints',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libx264',
    '-crf', '26',
    '-preset', 'medium',
    '-profile:v', 'baseline',       // Maximum hardware decoder compatibility on older phones
    '-level', '3.0',
    '-maxrate', '800k',             // Hard bitrate ceiling to prevent mobile bandwidth spikes
    '-bufsize', '1200k',            // Buffer size for rate control
  ],

  audioArgs: () => [
    '-c:a', 'aac',
    '-b:a', '96k',
    '-ar', '44100',
  ],

  containerArgs: () => [
    '-movflags', '+faststart',
  ],
};
