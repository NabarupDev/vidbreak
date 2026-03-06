/**
 * Example 08 — Encoding Presets
 *
 * vidbreak ships with battle-tested presets so you don't need to
 * think about codec flags. Just pick one.
 *
 * Available presets:
 *   'web'     — H.264 + AAC, broadest compatibility
 *   'hq'      — H.265/HEVC, high quality at smaller size
 *   'av1'     — AV1, best compression (slow to encode)
 *   'webm'    — VP9 + Opus, royalty-free
 *   'fast'    — Speed-optimised, lower quality
 *   'archive' — Near-lossless for long-term storage
 *   'mobile'  — Optimised for mobile bandwidth
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/08-presets.ts
 */
import { vidbreak } from 'vidbreak';

// Web preset — best for general browser/device playback
const webResult = await vidbreak('./input.mp4', {
  preset: 'web',
  formats: ['mp4'],
  resolutions: ['720p'],
  output: './output/preset-web',
});
console.log(`Web preset: ${webResult.files.length} file(s)`);

// Fast preset — quick encode, great for previews/drafts
const fastResult = await vidbreak('./input.mp4', {
  preset: 'fast',
  formats: ['mp4'],
  resolutions: ['480p'],
  output: './output/preset-fast',
});
console.log(`Fast preset: ${fastResult.files.length} file(s)`);

// Archive preset — near-lossless for long-term storage
const archiveResult = await vidbreak('./input.mp4', {
  preset: 'archive',
  formats: ['mkv'],
  resolutions: ['original'],
  output: './output/preset-archive',
});
console.log(`Archive preset: ${archiveResult.files.length} file(s)`);
