/**
 * Example 07 — Fluent Builder API
 *
 * Use the chainable builder for maximum control.
 * Every option can be set via a method call.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/07-builder-api.ts
 */
import { VidbreakBuilder } from 'vidbreak';

const result = await new VidbreakBuilder('./input.mp4')
  .output('./output/builder')
  .format('mp4', 'webm')
  .resolution('1080p', '720p', '480p')
  .preset('web')
  .hls({ segmentDuration: 4, resolutions: ['720p', '480p'] })
  .audio({ formats: ['mp3'], bitrate: '128k' })
  .thumbnails({ count: 3, format: 'jpg', width: 320 })
  .maxConcurrent(4)
  .failFast(true)
  .run();

console.log(`✅ Complete in ${result.duration}ms`);
console.log(`   Files: ${result.files.length}`);
console.log(`   HLS variants: ${result.hls?.variants.length ?? 0}`);
console.log(`   Errors: ${result.errors.length}`);
