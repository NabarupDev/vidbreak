import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { locateBinaries } from '../../../src/runner/BinaryLocator.js';
import { FFmpegNotFoundError } from '../../../src/errors/FFmpegNotFoundError.js';

describe('BinaryLocator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('prefers explicit options.ffmpegPath over all others', async () => {
    const result = await locateBinaries({
      ffmpegPath: '/custom/ffmpeg',
      ffprobePath: '/custom/ffprobe',
    });

    expect(result.ffmpeg).toBe('/custom/ffmpeg');
    expect(result.ffprobe).toBe('/custom/ffprobe');
  });

  it('falls back to FFMPEG_PATH env variable', async () => {
    process.env['FFMPEG_PATH'] = '/env/ffmpeg';
    process.env['FFPROBE_PATH'] = '/env/ffprobe';

    const result = await locateBinaries();

    expect(result.ffmpeg).toBe('/env/ffmpeg');
    expect(result.ffprobe).toBe('/env/ffprobe');
  });

  it('throws FFmpegNotFoundError with install instructions when nothing found', async () => {
    // Clear all paths
    delete process.env['FFMPEG_PATH'];
    delete process.env['FFPROBE_PATH'];

    // This test may find system ffmpeg; only test when we know it won't be found
    // by overriding PATH to empty
    const origPath = process.env['PATH'];
    process.env['PATH'] = '';

    try {
      await expect(locateBinaries()).rejects.toThrow(FFmpegNotFoundError);
    } finally {
      process.env['PATH'] = origPath;
    }
  });

  it('explicit path takes priority over env variable', async () => {
    process.env['FFMPEG_PATH'] = '/env/ffmpeg';

    const result = await locateBinaries({
      ffmpegPath: '/custom/ffmpeg',
    });

    expect(result.ffmpeg).toBe('/custom/ffmpeg');
  });
});
