// Main public API
export { vidbreak } from './vidbreak.js';
export { VidbreakBuilder } from './builder/VidbreakBuilder.js';

// Type exports
export type {
  VidbreakOptions,
  VidbreakResult,
  OutputFile,
  HLSResult,
  HLSVariant,
  VideoFormat,
  Resolution,
  PresetName,
  ProgressEvent,
  JobStartEvent,
  JobDoneEvent,
  JobErrorEvent,
  HLSOptions,
  AudioOptions,
  AudioFormat,
  ThumbnailOptions,
  HWAccelOptions,
  VideoProbe,
} from './types/index.js';

// Error exports
export {
  VidbreakError,
  FFmpegNotFoundError,
  EncodingError,
  ProbeError,
} from './errors/index.js';
