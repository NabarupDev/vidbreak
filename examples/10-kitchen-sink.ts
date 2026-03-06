/**
 * Example 10 — Kitchen Sink (Everything Together)
 *
 * A full real-world example: multi-format video, HLS streaming,
 * audio extraction, thumbnails, progress tracking, and error handling.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/10-kitchen-sink.ts
 */
import { vidbreak, FFmpegNotFoundError, ProbeError } from 'vidbreak';

const INPUT = './input.mp4';
const OUTPUT = './output/full-pipeline';

try {
  const result = await vidbreak(INPUT, {
    // Video output
    formats: ['mp4', 'webm'],
    resolutions: ['1080p', '720p', '480p'],
    preset: 'web',

    // HLS adaptive streaming
    hls: {
      segmentDuration: 6,
      resolutions: ['1080p', '720p', '480p'],
      segmentFormat: 'mp4',
    },

    // Audio extraction
    audio: {
      formats: ['mp3', 'aac'],
      bitrate: '192k',
      normalize: true,
    },

    // Thumbnails
    thumbnails: {
      count: 5,
      format: 'webp',
      width: 640,
    },

    // Performance
    maxConcurrent: 4,
    failFast: false, // collect all errors instead of stopping

    output: OUTPUT,

    // Progress tracking
    onProgress: (event) => {
      const pct = (event.percent * 100).toFixed(1);
      process.stdout.write(`\r🔄 ${pct}% | Speed: ${event.speed ?? '?'}x`);
    },
  });

  console.log('\n');

  // Summary
  const videos = result.files.filter((f) => f.type === 'video');
  const audio = result.files.filter((f) => f.type === 'audio');
  const thumbs = result.files.filter((f) => f.type === 'thumbnail');

  console.log(`✅ Pipeline complete in ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`   📹 ${videos.length} video file(s)`);
  console.log(`   🎵 ${audio.length} audio file(s)`);
  console.log(`   🖼️  ${thumbs.length} thumbnail(s)`);

  if (result.hls) {
    console.log(`   📡 HLS: ${result.hls.variants.length} variant(s)`);
    console.log(`      Master: ${result.hls.masterPlaylist}`);
  }

  // Input metadata
  console.log(`\n   Source: ${result.probe.width}x${result.probe.height}, ${result.probe.duration.toFixed(1)}s`);

  if (!result.success) {
    console.warn(`\n   ⚠️ ${result.errors.length} job(s) failed:`);
    for (const err of result.errors) {
      console.warn(`     - ${err.message}`);
    }
  }
} catch (error) {
  if (error instanceof FFmpegNotFoundError) {
    console.error('FFmpeg not found. Install it or run: npm install ffmpeg-static');
  } else if (error instanceof ProbeError) {
    console.error(`Cannot read input: ${(error as ProbeError).message}`);
  } else {
    throw error;
  }
}
