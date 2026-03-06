import { describe, it, expect } from 'vitest';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

// Integration tests require FFmpeg to be available
// Skip if not found
const FIXTURE = resolve(join(__dirname, '..', 'fixtures', 'sample.mp4'));
const HAS_FIXTURE = existsSync(FIXTURE);

// These tests are placed here but excluded in vitest.config.ts
// Run with: vitest run tests/integration/
describe.skipIf(!HAS_FIXTURE)('vidbreak() integration', () => {
  it('placeholder — integration tests require FFmpeg and sample fixture', () => {
    // This test file requires:
    // 1. FFmpeg installed on the system
    // 2. tests/fixtures/sample.mp4 generated via:
    //    ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
    //           -f lavfi -i sine=frequency=440:duration=5 \
    //           -c:v libx264 -c:a aac -shortest \
    //           tests/fixtures/sample.mp4
    expect(true).toBe(true);
  });
});
