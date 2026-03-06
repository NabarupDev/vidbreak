/**
 * Example 05 — Thumbnail Generation
 *
 * Generate thumbnails (preview images) from a video.
 * Useful for video catalogs, social media previews, etc.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/05-thumbnails.ts
 */
import { vidbreak } from 'vidbreak';

// Option A: Generate N evenly-spaced thumbnails
const result = await vidbreak('./input.mp4', {
  thumbnails: {
    count: 5,
    format: 'webp',
    width: 640,
  },
  output: './output/thumbnails',
});

const thumbs = result.files.filter((f) => f.type === 'thumbnail');
console.log(`✅ Generated ${thumbs.length} thumbnail(s):`);
for (const t of thumbs) {
  console.log(`  ${t.path}`);
}

// Option B: Capture at specific timestamps
const resultB = await vidbreak('./input.mp4', {
  thumbnails: {
    timestamps: [0, 10, '00:01:30', 120],  // seconds or HH:MM:SS
    format: 'jpg',
    width: 320,
  },
  output: './output/thumbnails-timed',
});

console.log(`✅ Generated ${resultB.files.filter((f) => f.type === 'thumbnail').length} timed thumbnails`);
