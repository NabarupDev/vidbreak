/**
 * Example 04 — Audio Extraction
 *
 * Extract audio tracks from a video into one or more formats.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/04-audio-extraction.ts
 */
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  audio: {
    formats: ['mp3', 'aac', 'opus'],
    bitrate: '192k',
    normalize: true,  // EBU R128 loudness normalization
  },
  output: './output/audio',
});

const audioFiles = result.files.filter((f) => f.type === 'audio');
console.log(`✅ Extracted ${audioFiles.length} audio file(s):`);

for (const file of audioFiles) {
  console.log(`  ${file.format} → ${file.path} (${file.size} bytes)`);
}
