import { describe, it, expect } from 'vitest';
import { resolveResolutions } from '../../../src/planner/ResolutionResolver.js';
import type { VideoProbe } from '../../../src/types/probe.types.js';

const makeProbe = (width: number, height: number): VideoProbe => ({
  duration: 10,
  width,
  height,
  fps: 30,
  hasAudio: true,
  videoCodec: 'h264',
  audioCodec: 'aac',
  bitrate: 5000,
  size: 6250000,
});

describe('ResolutionResolver', () => {
  it('converts named resolutions to width/height', () => {
    const probe = makeProbe(3840, 2160);
    const result = resolveResolutions(['1080p', '720p'], probe);

    expect(result).toHaveLength(2);
    expect(result[0]?.width).toBe(1920);
    expect(result[0]?.height).toBe(-2);
    expect(result[0]?.scaleFilter).toBe('1920:-2');
    expect(result[1]?.width).toBe(1280);
  });

  it('parses custom WxH strings', () => {
    const probe = makeProbe(3840, 2160);
    const result = resolveResolutions(['1920x1080'], probe);

    expect(result).toHaveLength(1);
    expect(result[0]?.width).toBe(1920);
    expect(result[0]?.name).toBe('1920x1080');
  });

  it('filters resolutions larger than source', () => {
    const probe = makeProbe(1280, 720);
    const result = resolveResolutions(['1080p', '720p', '480p'], probe);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(['720p', '480p']);
  });

  it('preserves source resolution for "original"', () => {
    const probe = makeProbe(1280, 720);
    const result = resolveResolutions(['original'], probe);

    expect(result).toHaveLength(1);
    expect(result[0]?.width).toBe(1280);
    expect(result[0]?.name).toBe('original');
  });

  it('deduplicates identical resolutions', () => {
    const probe = makeProbe(1920, 1080);
    const result = resolveResolutions(['1080p', '1920x1080'], probe);

    // Both resolve to width 1920, should deduplicate
    expect(result).toHaveLength(1);
  });

  it('handles all named resolutions', () => {
    const probe = makeProbe(3840, 2160);
    const result = resolveResolutions(
      ['4k', '2k', '1080p', '720p', '480p', '360p', '240p'],
      probe,
    );

    expect(result).toHaveLength(7);
  });

  it('handles empty resolution list', () => {
    const probe = makeProbe(1920, 1080);
    const result = resolveResolutions([], probe);
    expect(result).toHaveLength(0);
  });

  it('filters 4k when source is 1080p', () => {
    const probe = makeProbe(1920, 1080);
    const result = resolveResolutions(['4k', '1080p', '720p'], probe);

    expect(result.map((r) => r.name)).toEqual(['1080p', '720p']);
  });
});
