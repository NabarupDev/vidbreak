# Filename: ROADMAP.md

# vidbreak — Roadmap

> Versioned milestones, features, and long-term vision

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Done |
| 🔨 | In Progress |
| 📋 | Planned |
| 💡 | Under Consideration |
| ❌ | Rejected / Descoped |

---

## v0.1.0 — Foundation (Internal Alpha)

> Goal: Prove the core architecture is solid. Not published publicly.

- ✅ TypeScript project scaffold (strict mode, ESM + CJS dual output)
- ✅ `FFmpegRunner` — spawn, pipe stderr, resolve/reject
- ✅ `ProgressParser` — parse FFmpeg stderr into typed `ProgressEvent`
- ✅ `BinaryLocator` — PATH + ffmpeg-static + env var detection
- ✅ `probeVideo()` — ffprobe wrapper returning typed `VideoProbe`
- ✅ Basic `VideoEncoder` — single format, single resolution
- ✅ Unit test scaffold (Vitest)
- ✅ `ensureDir`, `formatBytes`, `timeToSeconds` utils

---

## v0.2.0 — Core Encoders (Private Beta)

> Goal: All encoder types working. Internal dogfooding begins.

- ✅ `AudioEncoder` — MP3 / AAC / Opus extraction
- ✅ `ThumbnailEncoder` — JPEG / PNG / WebP frame extraction
- ✅ `HLSEncoder` — Segment generation + m3u8 playlist creation
- ✅ Multi-resolution support with source-size guard
- ✅ `JobPlanner` — flat job list from `VidbreakOptions`
- ✅ `ConcurrencyScheduler` with p-limit
- ✅ `OutputCollector` — result assembly from disk
- ✅ Partial-failure model (`result.errors[]`)
- ✅ Integration tests against real FFmpeg

---

## v0.3.0 — Presets & Builder API (Public Beta)

> Goal: Developer-facing API is complete and ergonomic.

- 📋 All 7 built-in presets (`web`, `hq`, `av1`, `webm`, `fast`, `archive`, `mobile`)
- 📋 `VidbreakBuilder` with full fluent API
- 📋 Typed EventEmitter events on builder
- 📋 `vidbreak()` one-shot function
- 📋 Hardware acceleration support (`nvenc`, `vaapi`, `videotoolbox`, `qsv`)
- 📋 `hwAccel: 'auto'` detection logic
- 📋 CLI tool (`npx vidbreak ./input.mp4`) with progress bars
- 📋 README + API docs
- 📋 Published to npm as `vidbreak@0.3.0-beta.x`

---

## v1.0.0 — Production Release

> Goal: Stable, documented, battle-tested public release.

- 📋 Stable public API (semantic versioning from this point)
- 📋 Complete JSDoc on all exported types and functions
- 📋 Generated TypeDoc API documentation site
- 📋 100% test coverage of public API surface
- 📋 CI pipeline (GitHub Actions: lint, test, build, publish)
- 📋 Performance benchmarks vs fluent-ffmpeg published
- 📋 Migration guide from fluent-ffmpeg
- 📋 `vidbreak-static` sibling package (bundles `ffmpeg-static`)
- 📋 Security audit (npm audit, CodeQL)
- 📋 Changelog (Conventional Commits + `release-it`)

---

## v1.1.0 — DX & Ecosystem

> Goal: Best-in-class developer experience.

- 📋 Interactive CLI with `inquirer`-style setup wizard
- 📋 `--watch` mode for CLI (re-processes on file change)
- 📋 `vidbreak.config.ts` project-level config file support
- 📋 Custom preset authoring API
- 📋 Zod-based runtime option validation with clear error messages
- 📋 VS Code extension: right-click any video to run vidbreak

---

## v1.2.0 — Advanced Video Features

- 📋 Video trimming: `trim({ start, end })`
- 📋 Video concatenation: `VidbreakBuilder.concat([...inputs])`
- 📋 Watermarking / overlay: `overlay({ image, position })`
- 📋 Audio replacement: swap video audio track
- 📋 Subtitle embedding: SRT / VTT → burned-in or soft sub
- 📋 Two-pass encoding support for higher quality outputs
- 📋 DASH (Dynamic Adaptive Streaming over HTTP) output alongside HLS

---

## v2.0.0 — Streaming & Cloud

> Goal: Support server-side streaming and cloud storage targets.

- 💡 Readable stream input (process video from network source)
- 💡 Writable stream output (pipe encoded video to storage)
- 💡 S3/R2/GCS upload adapter (`@vidbreak/cloud`)
- 💡 Webhook / event-based progress callbacks for long jobs
- 💡 Job queue persistence (Redis adapter for crash recovery)
- 💡 Docker image: `ghcr.io/vidbreak/vidbreak` with FFmpeg bundled

---

## Future Considerations (No Milestone Yet)

- 💡 WASM build for in-browser transcoding (proof of concept)
- 💡 AI scene detection for smart thumbnail selection
- 💡 Automatic bitrate ladder generation based on content complexity
- 💡 Per-scene quality optimisation (like Netflix's Shot-Based Encoding)
- 💡 Encrypted HLS (AES-128) output
- 💡 DRM-ready output stubs (Widevine/PlayReady manifest generation)

---

## Rejected Ideas

- ❌ **Built-in FFmpeg download** — adds too much install weight; use `ffmpeg-static` instead
- ❌ **GUI desktop app** — out of scope for a library; ecosystem concern
- ❌ **Real-time streaming (RTMP/SRT)** — separate domain, separate tool
- ❌ **Image-to-video** — out of scope for v1

---

## Versioning Policy

vidbreak follows **Semantic Versioning (semver)**:

- **Patch** (`1.0.x`) — Bug fixes, no API changes
- **Minor** (`1.x.0`) — New features, fully backward-compatible
- **Major** (`x.0.0`) — Breaking API changes (announced 60 days in advance)

Pre-release versions use `-beta.x` and `-alpha.x` suffixes.
