/**
 * Example 02 — Multi-Format & Multi-Resolution
 *
 * Convert a single input to multiple formats and resolutions at once.
 * vidbreak handles all the FFmpeg orchestration internally.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/02-multi-format.ts
 */
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  formats: ['mp4', 'webm', 'av1'],
  resolutions: ['1080p', '720p', '480p'],
  preset: 'web',
  output: './output/multi-format',
});

console.log(`✅ Conversion complete — ${result.files.length} files generated`);

for (const file of result.files) {
  console.log(`  [${file.type}] ${file.resolution ?? ''} ${file.format} → ${file.path}`);
}

if (!result.success) {
  console.warn(`⚠️ ${result.errors.length} job(s) failed:`);
  for (const err of result.errors) {
    console.warn(`  ${err.message}`);
  }
}
