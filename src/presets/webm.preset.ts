import type { PresetDefinition } from './index.js';

/**
 * WebM preset — open web standard (VP9 + Opus).
 * Target: Open-source-first deployments, H.264-license-free browsers.
 */
export const webmPreset: PresetDefinition = {
  name: 'webm',
  description: 'Open formats only (VP9 + Opus)',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libvpx-vp9',
    '-crf', '31',
    '-b:v', '0',                    // CRF mode (constrained quality)
    '-deadline', 'good',            // Quality-first encoding
    '-cpu-used', '2',               // Reasonable speed
    '-row-mt', '1',
    '-tile-columns', '2',
  ],

  audioArgs: () => [
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
  ],

  containerArgs: () => [],
};
