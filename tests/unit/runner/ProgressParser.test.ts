import { describe, it, expect } from 'vitest';
import { ProgressParser } from '../../../src/runner/ProgressParser.js';

describe('ProgressParser', () => {
  it('parses a complete progress line', () => {
    const line = 'frame=  120 fps= 24 q=28.0 size=    512kB time=00:00:05.00 bitrate= 838.9kbits/s speed=2.0x';
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    const result = parser.parseLine(line);

    expect(result).not.toBeNull();
    expect(result?.percent).toBe(50);
    expect(result?.fps).toBe(24);
    expect(result?.speed).toBe(2.0);
    expect(result?.currentSize).toBe(524288); // 512 * 1024
  });

  it('returns null for non-progress lines', () => {
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    expect(parser.parseLine('Input #0, mov,mp4,m4a')).toBeNull();
    expect(parser.parseLine('')).toBeNull();
    expect(parser.parseLine('Stream #0:0: Video: h264')).toBeNull();
  });

  it('clamps percent to 100 on overrun', () => {
    const line = 'frame=  300 fps= 24 q=28.0 size=   2048kB time=00:00:11.00 bitrate= 838.9kbits/s speed=1.0x';
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    const result = parser.parseLine(line);
    expect(result?.percent).toBe(100);
  });

  it('computes ETA correctly', () => {
    const line = 'frame=  120 fps= 24 q=28.0 size=    512kB time=00:00:05.00 bitrate= 838.9kbits/s speed=2.0x';
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    const result = parser.parseLine(line);

    // ETA = (10 - 5) / 2.0 = 2.5 seconds
    expect(result?.eta).toBe(2.5);
  });

  it('includes jobId and label in result', () => {
    const line = 'frame=   60 fps= 30 q=28.0 size=    256kB time=00:00:02.00 bitrate= 400kbits/s speed=1.5x';
    const parser = new ProgressParser({ duration: 10, jobId: 'job-123', label: 'MP4 720p' });
    const result = parser.parseLine(line);

    expect(result?.jobId).toBe('job-123');
    expect(result?.label).toBe('MP4 720p');
  });

  it('handles zero duration gracefully', () => {
    const line = 'frame=   10 fps= 30 q=28.0 size=    100kB time=00:00:01.00 bitrate= 400kbits/s speed=1.0x';
    const parser = new ProgressParser({ duration: 0, jobId: 'test', label: 'test' });
    const result = parser.parseLine(line);

    expect(result?.percent).toBe(0);
  });

  it('handles line with only frame= but no time=', () => {
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    expect(parser.parseLine('frame=  120 fps= 24 q=28.0')).toBeNull();
  });

  it('handles line with time= but no frame=', () => {
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    expect(parser.parseLine('time=00:00:05.00 speed=2.0x')).toBeNull();
  });
});
