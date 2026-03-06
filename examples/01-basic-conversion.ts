/**
 * Example 01 — Basic Video Conversion
 *
 * The simplest usage: convert a video to MP4.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/01-basic-conversion.ts
 */
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  formats: ['mp4'],
  resolutions: ['720p'],
  output: './output/basic',
});

console.log(`✅ Done in ${result.duration}ms`);
console.log(`Generated ${result.files.length} file(s):`);

for (const file of result.files) {
  console.log(`  ${file.type} — ${file.path} (${file.size} bytes)`);
}
