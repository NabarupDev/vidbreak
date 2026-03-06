/**
 * Example 03 — HLS Adaptive Streaming
 *
 * Generate HLS output with a master playlist and multiple resolution variants.
 * Perfect for web video players (hls.js, Video.js, etc.).
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/03-hls-streaming.ts
 */
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  hls: {
    segmentDuration: 6,
    resolutions: ['1080p', '720p', '480p'],
    segmentFormat: 'mp4',   // fMP4 segments (modern HLS)
  },
  output: './output/hls-stream',
});

if (result.hls) {
  console.log(`✅ HLS output ready`);
  console.log(`   Master playlist: ${result.hls.masterPlaylist}`);
  console.log(`   Variants: ${result.hls.variants.length}`);

  for (const variant of result.hls.variants) {
    console.log(`   • ${variant.resolution} — ${variant.segments.length} segments`);
  }
} else {
  console.log('No HLS output generated.');
}
