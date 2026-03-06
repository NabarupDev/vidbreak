/**
 * Example 06 — Progress Events
 *
 * Track encoding progress in real-time using the onProgress callback
 * or the builder's typed event emitter.
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/06-progress-events.ts
 */
import { vidbreak, VidbreakBuilder } from 'vidbreak';

// ─── Option A: Using the one-shot function with onProgress ───
console.log('=== One-shot API with onProgress ===\n');

await vidbreak('./input.mp4', {
  formats: ['mp4'],
  resolutions: ['720p'],
  output: './output/progress-demo',
  onProgress: (event) => {
    const pct = (event.percent * 100).toFixed(1);
    process.stdout.write(`\r  Encoding: ${pct}% | Speed: ${event.speed ?? '?'}x | FPS: ${event.fps ?? '?'}`);
  },
});

console.log('\n✅ Done\n');

// ─── Option B: Using the builder API with typed events ───
console.log('=== Builder API with typed events ===\n');

const result = await new VidbreakBuilder('./input.mp4')
  .format('mp4', 'webm')
  .resolution('1080p')
  .output('./output/progress-builder')
  .on('job:start', (e) => {
    console.log(`  ▶ Started: ${e.label}`);
  })
  .on('progress', (e) => {
    const pct = (e.percent * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${pct}%`);
  })
  .on('job:done', (e) => {
    console.log(`\n  ✔ Finished: ${e.label} → ${e.outputPath}`);
  })
  .on('job:error', (e) => {
    console.error(`\n  ✖ Failed: ${e.label} — ${e.error.message}`);
  })
  .run();

console.log(`\n✅ All done — ${result.files.length} file(s) generated`);
