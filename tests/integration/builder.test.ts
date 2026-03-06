import { describe, it, expect } from 'vitest';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const FIXTURE = resolve(join(__dirname, '..', 'fixtures', 'sample.mp4'));
const HAS_FIXTURE = existsSync(FIXTURE);

// Integration tests require FFmpeg + fixture
describe.skipIf(!HAS_FIXTURE)('VidbreakBuilder integration', () => {
  it('placeholder — builder integration tests require FFmpeg and sample fixture', () => {
    expect(true).toBe(true);
  });
});
