/**
 * Example 09 — Error Handling
 *
 * vidbreak provides typed error classes for clean error handling.
 *
 * Error types:
 *   FFmpegNotFoundError — ffmpeg/ffprobe binary not found
 *   ProbeError          — ffprobe failed to read the input
 *   EncodingError       — an FFmpeg encoding job failed
 *   VidbreakError       — base class for all vidbreak errors
 *
 * Prerequisites:
 *   npm install vidbreak
 *   FFmpeg installed on PATH (or: npm install ffmpeg-static)
 *
 * Run:
 *   npx tsx examples/09-error-handling.ts
 */
import {
  vidbreak,
  VidbreakError,
  FFmpegNotFoundError,
  ProbeError,
  EncodingError,
} from 'vidbreak';

try {
  const result = await vidbreak('./input.mp4', {
    formats: ['mp4', 'webm'],
    resolutions: ['1080p', '720p'],
    output: './output/error-demo',
  });

  // Check for partial failures (some jobs failed, others succeeded)
  if (!result.success) {
    console.warn(`⚠️ Completed with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.warn(`  Job "${err.jobId}": ${err.message}`);
    }
  } else {
    console.log(`✅ All ${result.files.length} file(s) generated successfully`);
  }
} catch (error) {
  if (error instanceof FFmpegNotFoundError) {
    console.error('❌ FFmpeg not found. Install it:');
    console.error('   brew install ffmpeg       (macOS)');
    console.error('   sudo apt install ffmpeg   (Linux)');
    console.error('   choco install ffmpeg      (Windows)');
    console.error('   npm install ffmpeg-static  (bundled)');
  } else if (error instanceof ProbeError) {
    console.error(`❌ Cannot read input file: ${error.message}`);
  } else if (error instanceof EncodingError) {
    console.error(`❌ Encoding failed: ${error.message}`);
  } else if (error instanceof VidbreakError) {
    console.error(`❌ vidbreak error: ${error.message}`);
  } else {
    throw error; // Re-throw unexpected errors
  }
}
