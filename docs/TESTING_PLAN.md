# Filename: TESTING_PLAN.md

# vidbreak — Testing Plan

> Strategy, structure, tooling, and coverage targets for a production-grade test suite

---

## Testing Stack

| Tool | Role |
|------|------|
| **Vitest** | Test runner (fast, native ESM, great TypeScript support) |
| **@vitest/coverage-v8** | Coverage via Node.js V8 engine |
| **vi.spyOn / vi.fn** | Mocking FFmpeg child processes |
| **execa** (test-only) | Verify CLI output in integration tests |
| **tmp** | Temporary directories for integration test outputs |

---

## Test Categories

### 1. Unit Tests (`tests/unit/`)

Pure logic tests with no FFmpeg required. Mocked child processes.

#### `runner/ProgressParser.test.ts`

Tests the stderr line parser in isolation.

```ts
import { describe, it, expect } from 'vitest';
import { ProgressParser } from '../../src/runner/ProgressParser.js';

describe('ProgressParser', () => {
  it('parses a complete progress line', () => {
    const line = 'frame=  120 fps= 24 q=28.0 size=    512kB time=00:00:05.00 bitrate= 838.9kbits/s speed=2.0x';
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    const result = parser.parseLine(line);

    expect(result).toMatchObject({
      percent: 50,
      fps: 24,
      speed: 2.0,
      currentSize: 524288,
    });
  });

  it('returns null for non-progress lines', () => {
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    expect(parser.parseLine('Input #0, mov,mp4,m4a')).toBeNull();
  });

  it('clamps percent to 100 on overrun', () => {
    // FFmpeg sometimes reports slightly over duration
    const line = 'frame=  300 fps= 24 q=28.0 size=   2048kB time=00:00:11.00 bitrate= 838.9kbits/s speed=1x';
    const parser = new ProgressParser({ duration: 10, jobId: 'test', label: 'test' });
    const result = parser.parseLine(line);
    expect(result?.percent).toBe(100);
  });
});
```

#### `planner/ResolutionResolver.test.ts`

```ts
describe('ResolutionResolver', () => {
  it('converts named resolutions to width/height', () => { ... });
  it('parses custom WxH strings', () => { ... });
  it('filters resolutions larger than source', () => { ... });
  it('preserves source resolution for "original"', () => { ... });
  it('deduplicates identical resolutions', () => { ... });
});
```

#### `planner/JobPlanner.test.ts`

```ts
describe('JobPlanner', () => {
  it('generates video jobs for each format × resolution combination', () => { ... });
  it('skips audio job if source has no audio stream', () => { ... });
  it('generates correct number of thumbnail jobs', () => { ... });
  it('generates HLS jobs with correct segment args', () => { ... });
  it('assigns unique IDs to all jobs', () => { ... });
  it('orders jobs: video → audio → hls → thumbnails', () => { ... });
});
```

#### `runner/BinaryLocator.test.ts`

```ts
describe('BinaryLocator', () => {
  it('prefers explicit options.ffmpegPath over all others', () => { ... });
  it('falls back to FFMPEG_PATH env variable', () => { ... });
  it('detects ffmpeg-static if installed', () => { ... });
  it('throws FFmpegNotFoundError with install instructions', () => { ... });
});
```

#### `utils/*.test.ts`

```ts
describe('timeToSeconds', () => {
  it('converts HH:MM:SS to seconds', () => { ... });
  it('handles MM:SS format', () => { ... });
  it('handles plain number strings', () => { ... });
});

describe('formatBytes', () => {
  it('formats bytes, KB, MB, GB correctly', () => { ... });
});
```

---

### 2. Integration Tests (`tests/integration/`)

These tests spawn real FFmpeg processes. They are marked with `@integration` and skipped in CI unless `FFMPEG_PATH` or system FFmpeg is available.

#### Fixture Video

`tests/fixtures/sample.mp4` — A 5-second, 1280×720, 30fps video with a sine wave audio track. Generated once:

```bash
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
       -f lavfi -i sine=frequency=440:duration=5 \
       -c:v libx264 -c:a aac -shortest \
       tests/fixtures/sample.mp4
```

#### `integration/vidbreak.test.ts`

```ts
import { vidbreak } from '../../src/index.js';
import { existsSync } from 'fs';
import { join } from 'path';

describe('vidbreak() integration', () => {
  it('generates MP4 at 720p', async () => {
    const result = await vidbreak(FIXTURE, {
      formats: ['mp4'],
      resolutions: ['720p'],
      output: tmpDir(),
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].format).toBe('mp4');
    expect(existsSync(result.files[0].path)).toBe(true);
  });

  it('generates multiple formats in parallel', async () => {
    const result = await vidbreak(FIXTURE, {
      formats: ['mp4', 'webm'],
      resolutions: ['480p'],
      output: tmpDir(),
      maxConcurrent: 2,
    });

    expect(result.files).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('extracts MP3 audio', async () => {
    const result = await vidbreak(FIXTURE, {
      audio: { formats: ['mp3'] },
      output: tmpDir(),
    });

    const audioFile = result.files.find(f => f.type === 'audio');
    expect(audioFile).toBeDefined();
    expect(audioFile?.format).toBe('mp3');
    expect(audioFile?.size).toBeGreaterThan(0);
  });

  it('generates HLS output', async () => {
    const result = await vidbreak(FIXTURE, {
      hls: true,
      resolutions: ['720p', '480p'],
      output: tmpDir(),
    });

    expect(result.hls?.masterPlaylist).toBeDefined();
    expect(existsSync(result.hls!.masterPlaylist)).toBe(true);
    expect(result.hls?.variants).toHaveLength(2);
  });

  it('generates thumbnails', async () => {
    const result = await vidbreak(FIXTURE, {
      thumbnails: { count: 3 },
      output: tmpDir(),
    });

    const thumbs = result.files.filter(f => f.type === 'thumbnail');
    expect(thumbs).toHaveLength(3);
    thumbs.forEach(t => expect(existsSync(t.path)).toBe(true));
  });

  it('skips resolutions larger than source', async () => {
    const result = await vidbreak(FIXTURE, {
      formats: ['mp4'],
      resolutions: ['1080p', '720p', '480p'],  // fixture is 720p
      output: tmpDir(),
    });

    const resolutions = result.files.map(f => f.resolution);
    expect(resolutions).not.toContain('1080p');
    expect(resolutions).toContain('720p');
    expect(resolutions).toContain('480p');
  });

  it('collects partial errors without throwing', async () => {
    // av1 may not be available on all CI machines
    const result = await vidbreak(FIXTURE, {
      formats: ['mp4', 'av1'],
      output: tmpDir(),
    });

    expect(result.files.some(f => f.format === 'mp4')).toBe(true);
    // Does not throw even if av1 failed
  });
});
```

#### `integration/builder.test.ts`

```ts
describe('VidbreakBuilder integration', () => {
  it('emits progress events during encoding', async () => {
    const events: ProgressEvent[] = [];

    await new VidbreakBuilder(FIXTURE)
      .format('mp4')
      .resolution('480p')
      .output(tmpDir())
      .on('progress', e => events.push(e))
      .run();

    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1].percent).toBe(100);
  });

  it('emits job:done for each completed job', async () => {
    const done: string[] = [];

    await new VidbreakBuilder(FIXTURE)
      .format('mp4', 'webm')
      .resolution('360p')
      .output(tmpDir())
      .on('job:done', e => done.push(e.jobId))
      .run();

    expect(done).toHaveLength(2);
  });
});
```

---

### 3. Type Tests (`tests/types/`)

Verify the TypeScript type contracts are correct using `expect-type` or `ts-expect-error` comments.

```ts
// tests/types/options.test-d.ts
import { expectType } from 'vitest';
import type { VidbreakOptions } from '../../src/types/options.types.js';

// Valid options
const valid: VidbreakOptions = {
  formats: ['mp4', 'webm'],
  resolutions: ['1080p', '720p'],
  audio: true,
};

// @ts-expect-error — 'mp5' is not a valid format
const invalid: VidbreakOptions = { formats: ['mp5'] };
```

---

## Vitest Config

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**'],  // Excluded from default run
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
      exclude: ['src/cli/**', 'src/types/**'],
    },
  },
});
```

---

## Coverage Targets

| Module | Target |
|--------|--------|
| `runner/` | 95% |
| `planner/` | 95% |
| `encoders/` | 85% (integration tested) |
| `utils/` | 100% |
| `errors/` | 100% |
| `presets/` | 80% |
| **Overall** | **90%** |

---

## Test Data Policy

- No video files >10MB in the repo
- The `sample.mp4` fixture is regenerated via a script if missing
- CI always regenerates fixtures to avoid stale binary blobs

---

## Running Tests

```bash
# Unit tests only (no FFmpeg needed)
npm test

# Unit + integration
FFMPEG_PATH=$(which ffmpeg) npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode (development)
npm run test:watch
```
