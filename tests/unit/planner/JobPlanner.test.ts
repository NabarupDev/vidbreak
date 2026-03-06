import { describe, it, expect } from 'vitest';
import { planJobs } from '../../../src/planner/JobPlanner.js';
import type { VidbreakOptions } from '../../../src/types/options.types.js';
import type { VideoProbe } from '../../../src/types/probe.types.js';
import type { BinaryPaths } from '../../../src/runner/BinaryLocator.js';

const probe: VideoProbe = {
  duration: 10,
  width: 1920,
  height: 1080,
  fps: 30,
  hasAudio: true,
  videoCodec: 'h264',
  audioCodec: 'aac',
  bitrate: 5000,
  size: 6250000,
};

const binaries: BinaryPaths = {
  ffmpeg: '/usr/bin/ffmpeg',
  ffprobe: '/usr/bin/ffprobe',
};

describe('JobPlanner', () => {
  it('generates video jobs for each format × resolution combination', () => {
    const options: VidbreakOptions = {
      formats: ['mp4', 'webm'],
      resolutions: ['1080p', '720p'],
    };

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const videoJobs = jobs.filter((j) => j.type === 'video');

    expect(videoJobs).toHaveLength(4); // 2 formats × 2 resolutions
  });

  it('skips audio job if source has no audio stream', () => {
    const noAudioProbe = { ...probe, hasAudio: false };
    const options: VidbreakOptions = {
      audio: true,
    };

    const jobs = planJobs('/input.mp4', options, noAudioProbe, binaries, '/output');
    const audioJobs = jobs.filter((j) => j.type === 'audio');

    expect(audioJobs).toHaveLength(0);
  });

  it('generates audio jobs when source has audio', () => {
    const options: VidbreakOptions = {
      audio: { formats: ['mp3', 'aac'] },
    };

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const audioJobs = jobs.filter((j) => j.type === 'audio');

    expect(audioJobs).toHaveLength(2);
  });

  it('generates thumbnail jobs', () => {
    const options: VidbreakOptions = {
      thumbnails: { count: 5 },
    };

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const thumbJobs = jobs.filter((j) => j.type === 'thumbnail');

    expect(thumbJobs).toHaveLength(1); // Single FFmpeg job produces all thumbs
  });

  it('generates HLS jobs with correct segment args', () => {
    const options: VidbreakOptions = {
      hls: { resolutions: ['720p', '480p'] },
    };

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const hlsJobs = jobs.filter((j) => j.type === 'hls');

    expect(hlsJobs).toHaveLength(2);
  });

  it('assigns unique IDs to all jobs', () => {
    const options: VidbreakOptions = {
      formats: ['mp4', 'webm'],
      resolutions: ['1080p', '720p'],
      audio: true,
      thumbnails: true,
    };

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const ids = jobs.map((j) => j.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('orders jobs: video → audio → hls → thumbnails', () => {
    const options: VidbreakOptions = {
      formats: ['mp4'],
      resolutions: ['720p'],
      audio: true,
      hls: true,
      thumbnails: true,
    };

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const types = jobs.map((j) => j.type);

    // Video first
    const videoIdx = types.indexOf('video');
    const audioIdx = types.indexOf('audio');
    const hlsIdx = types.indexOf('hls');
    const thumbIdx = types.indexOf('thumbnail');

    expect(videoIdx).toBeLessThan(audioIdx);
    expect(audioIdx).toBeLessThan(hlsIdx);
    expect(hlsIdx).toBeLessThan(thumbIdx);
  });

  it('uses default mp4 format when none specified', () => {
    const options: VidbreakOptions = {};

    const jobs = planJobs('/input.mp4', options, probe, binaries, '/output');
    const videoJobs = jobs.filter((j) => j.type === 'video');

    expect(videoJobs).toHaveLength(1);
    expect(videoJobs[0]?.label).toContain('MP4');
  });
});
