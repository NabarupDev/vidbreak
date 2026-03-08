# vidbreak

> **The modern, lightweight, drop-in replacement for the now-deprecated `fluent-ffmpeg`**

[![npm version](https://img.shields.io/npm/v/vidbreak)](https://npmjs.com/package/vidbreak)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js ≥ 18](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

---

## Why vidbreak?

`fluent-ffmpeg` hasn't been meaningfully maintained since 2021. Its API is callback-only, has no TypeScript types, can't do adaptive streaming, and requires heavy boilerplate for even basic tasks. **vidbreak** was built from scratch to be everything fluent-ffmpeg should have become.

| Feature | fluent-ffmpeg | **vidbreak** |
|---|---|---|
| TypeScript-first | ❌ | ✅ |
| Promise / async-await | ❌ | ✅ |
| HLS adaptive streaming | ❌ | ✅ |
| Multi-format in one call | ❌ | ✅ |
| Audio extraction | Manual | ✅ Auto |
| Thumbnails | Manual | ✅ Auto |
| Zero-config presets | ❌ | ✅ |
| Progress events (typed) | Partial | ✅ |
| Hardware acceleration | ❌ | ✅ Optional |

---

## Quick Start

```bash
npm install vidbreak
```

```ts
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  formats: ['mp4', 'webm', 'av1'],
  resolutions: ['1080p', '720p', '480p'],
  hls: true,
  audio: true,
  thumbnails: { count: 5 },
  output: './dist/video',
});

console.log(result.files);  // All generated files with metadata
```

That's it. No FFmpeg flags. No callback hell. No manual pipe management.

---

## Installation

```bash
npm install vidbreak
```

**FFmpeg is bundled automatically** — no separate install needed. vidbreak ships with `ffmpeg-static` and `@ffprobe-installer/ffprobe`, so FFmpeg and ffprobe binaries are downloaded for your platform during `npm install`.

If you already have FFmpeg installed on your system, vidbreak will use the bundled version by default but you can point to your own binary via:

- `options.ffmpegPath` / `options.ffprobePath`
- `FFMPEG_PATH` / `FFPROBE_PATH` environment variables

vidbreak auto-detects binaries in this priority order: explicit options → environment variables → bundled binaries → system PATH.

---

## Core Concepts

### Presets

vidbreak ships with battle-tested encoding presets:

- **`web`** — H.264 + AAC, broad compatibility
- **`hq`** — H.265/HEVC for high quality at smaller size
- **`av1`** — AV1 for modern streaming platforms
- **`webm`** — VP9 + Opus, open-source web standard
- **`hls`** — HLS with multi-bitrate adaptive streaming

### Output Structure

```
dist/video/
├── 1080p/
│   ├── video.mp4
│   └── video.webm
├── 720p/
│   └── video.mp4
├── hls/
│   ├── master.m3u8
│   ├── 1080p/
│   └── 720p/
├── audio/
│   ├── audio.mp3
│   └── audio.aac
└── thumbnails/
    ├── thumb_01.jpg
    └── thumb_02.jpg
```

---

## Full API Overview

```ts
// One-shot conversion
vidbreak(input, options): Promise<VidbreakResult>

// Chainable builder API
new VidbreakBuilder(input)
  .format('mp4', 'webm')
  .resolution('1080p', '720p')
  .hls({ segmentDuration: 6 })
  .audio({ format: 'mp3', bitrate: '192k' })
  .thumbnails({ count: 3, format: 'jpg' })
  .preset('web')
  .output('./dist')
  .run()
```

See [API_DESIGN.md](./API_DESIGN.md) for the complete API reference.

---

## Comparison with fluent-ffmpeg

```ts
// fluent-ffmpeg (old, painful)
const ffmpeg = require('fluent-ffmpeg');

ffmpeg('./input.mp4')
  .videoCodec('libx264')
  .audioCodec('aac')
  .size('1280x720')
  .on('end', () => console.log('done'))
  .on('error', (err) => console.error(err))
  .save('./output.mp4');

// vidbreak (modern, expressive)
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  resolutions: ['720p'],
  formats: ['mp4'],
  output: './output',
});
```

---

## Documentation

- [API Design](./API_DESIGN.md) — Full TypeScript interface reference
- [Architecture](./ARCHITECTURE.md) — How vidbreak works internally
- [Roadmap](./ROADMAP.md) — What's coming next
- [FFmpeg Strategy](./FFMPEG_STRATEGY.md) — Encoding decisions explained
- [Testing Plan](./TESTING_PLAN.md) — How we ensure correctness
- [Contributing](./CONTRIBUTING.md) — How to contribute
- [Package Spec](./PACKAGE_SPEC.md) — npm package configuration

---

## License

MIT © 2026 vidbreak contributors
