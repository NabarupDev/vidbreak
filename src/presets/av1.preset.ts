import type { PresetDefinition } from './index.js';

/**
 * AV1 preset — maximum compression.
 * Target: Streaming platforms, CDN-delivered content at scale.
 * Automatically uses SVT-AV1 if available over libaom-av1.
 */
export const av1Preset: PresetDefinition = {
  name: 'av1',
  description: 'AV1 — best compression, slow encode',

  videoArgs: (resolution: string) => [
    '-vf', `scale=${resolution}`,
    '-c:v', 'libaom-av1',
    '-crf', '30',
    '-b:v', '0',                    // Enables CRF mode for libaom
    '-cpu-used', '4',               // Speed/quality tradeoff: 4 is practical for batch encoding
    '-row-mt', '1',                 // Multi-threaded row encoding for speedup
    '-tiles', '2x2',               // Parallel tile encoding
  ],

  audioArgs: () => [
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',                   // Variable bitrate for best quality/size
  ],

  containerArgs: () => [],
};
