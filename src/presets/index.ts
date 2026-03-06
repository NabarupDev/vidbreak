import type { PresetName } from '../types/options.types.js';

/**
 * Defines the encoding parameters for a preset.
 */
export interface PresetDefinition {
  /** Preset name */
  name: PresetName;

  /** Human-readable description */
  description: string;

  /** Returns FFmpeg video encoding flags */
  videoArgs: (resolution: string) => string[];

  /** Returns FFmpeg audio encoding flags */
  audioArgs: () => string[];

  /** Returns FFmpeg container/muxer flags */
  containerArgs: () => string[];
}

export { webPreset } from './web.preset.js';
export { hqPreset } from './hq.preset.js';
export { av1Preset } from './av1.preset.js';
export { webmPreset } from './webm.preset.js';
export { fastPreset } from './fast.preset.js';
export { archivePreset } from './archive.preset.js';
export { mobilePreset } from './mobile.preset.js';

import { webPreset } from './web.preset.js';
import { hqPreset } from './hq.preset.js';
import { av1Preset } from './av1.preset.js';
import { webmPreset } from './webm.preset.js';
import { fastPreset } from './fast.preset.js';
import { archivePreset } from './archive.preset.js';
import { mobilePreset } from './mobile.preset.js';

const presetMap: Record<PresetName, PresetDefinition> = {
  web: webPreset,
  hq: hqPreset,
  av1: av1Preset,
  webm: webmPreset,
  fast: fastPreset,
  archive: archivePreset,
  mobile: mobilePreset,
};

/**
 * Look up a preset by name.
 */
export function getPreset(name: PresetName): PresetDefinition {
  return presetMap[name];
}

/**
 * List all available presets with their descriptions.
 */
export function listPresets(): Array<{ name: PresetName; description: string }> {
  return Object.values(presetMap).map((p) => ({
    name: p.name,
    description: p.description,
  }));
}
