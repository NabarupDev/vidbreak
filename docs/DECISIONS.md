# Filename: DECISIONS.md

# vidbreak — Architecture Decision Records (ADRs)

> Every major technical decision, the options considered, and why we chose what we chose.
> This document is the source of truth for "why does vidbreak work this way?"

---

## ADR-001 — Language: TypeScript (strict mode)

**Date:** Project inception
**Status:** Accepted

### Context

The npm ecosystem has largely shifted to TypeScript for library authorship. The original `fluent-ffmpeg` has no types (or third-party `@types/fluent-ffmpeg` that lag behind), which is a constant pain point for TypeScript users.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Plain JavaScript | Simpler, no compile step | No type safety, no IntelliSense for consumers |
| TypeScript (loose) | Some types | False confidence from permissive config |
| **TypeScript (strict)** | Full type safety, excellent DX | Slightly more verbose |
| TypeScript + JSDoc | No compile step | JSDoc types are unwieldy for complex generics |

### Decision

TypeScript with the strictest possible configuration: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. This catches entire categories of bugs at compile time and gives consumers world-class autocomplete.

---

## ADR-002 — Build System: tsup over tsc

**Date:** Project inception
**Status:** Accepted

### Context

We need to produce dual ESM + CJS output (for maximum compatibility), declaration files, and source maps. Plain `tsc` can't produce CJS from ESM source without heavy `package.json` gymnastics.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Plain `tsc` | No extra dep | CJS output requires separate tsconfig, complex |
| **tsup** | One config, ESM+CJS+DTS in one command, fast (esbuild) | Extra dev dependency |
| Rollup | Very configurable | Config verbosity, slower |
| Vite | Excellent DX | Overkill for a library, browser-first |
| unbuild | Clean API | Less mature, smaller ecosystem |

### Decision

`tsup` because it wraps esbuild (extremely fast), requires minimal configuration, and handles the dual-output case cleanly. A single `tsup.config.ts` replaces 3 separate `tsconfig.*.json` files.

---

## ADR-003 — Test Runner: Vitest over Jest

**Date:** Project inception
**Status:** Accepted

### Context

Jest is the most popular test runner but has significant friction with native ESM and TypeScript. It requires Babel or `ts-jest` transforms which add complexity and slow down the test cycle.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Vitest** | Native ESM, TypeScript without transforms, fast, Jest-compatible API | Newer, smaller ecosystem |
| Jest + ts-jest | Huge ecosystem, familiar | ESM story is messy, slow transform |
| Mocha + chai | Flexible | More boilerplate, no coverage built-in |
| node:test | Zero deps | Limited mocking, young API |

### Decision

Vitest. It's Jest's API with native ESM and TypeScript support. Migration cost from Jest is near-zero. For a greenfield TypeScript project, there's no reason to choose Jest in 2024+.

---

## ADR-004 — Concurrency: p-limit over custom queue

**Date:** Architecture phase
**Status:** Accepted

### Context

FFmpeg is CPU-intensive. Running too many parallel processes causes thrashing. We need a bounded concurrency queue for job execution.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **p-limit** | Tiny, 0 transitive deps, Promise-based | External dep |
| Custom queue with setTimeout | Zero deps | Reinventing the wheel, easy to get wrong |
| Bull/BullMQ | Production-grade job queue | Requires Redis, massive overkill |
| async queue (caolan/async) | Well-tested | Large library, CommonJS legacy |
| `Promise.all` with slicing | Simple | No dynamic addition of jobs |

### Decision

`p-limit`. It's the gold standard for bounded Promise concurrency in the Node ecosystem. Its bundle size is negligible (~2KB) and it has been battle-tested with millions of weekly downloads. This is the one runtime dependency vidbreak intentionally accepts.

---

## ADR-005 — FFmpeg Spawning: child_process.spawn vs execa

**Date:** Architecture phase
**Status:** Accepted

### Context

We need to spawn FFmpeg, stream its stderr for progress, and handle exit codes cleanly.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **child_process.spawn** | Zero deps, direct access, full control | More boilerplate |
| execa | Beautiful API, great error handling | Extra dependency |
| child_process.exec | Simple | Buffers all output, useless for streaming progress |
| node:child_process (same as above) | Built-in | Same as spawn |

### Decision

`child_process.spawn`. The boilerplate is contained in `FFmpegRunner.ts` — a single file that doesn't change often. Adding `execa` would be our second runtime dependency for no gain that isn't already encapsulated.

---

## ADR-006 — Error Model: Partial Failure vs Fail-Fast Default

**Date:** API design phase
**Status:** Accepted

### Context

If a user requests 3 formats and one FFmpeg job fails (e.g. AV1 codec unavailable), should we abort the whole operation or continue?

### Options Considered

| Option | Behaviour |
|--------|-----------|
| **Partial failure (default)** | Collect errors in `result.errors[]`, continue other jobs |
| Fail-fast (default) | First error throws, all jobs aborted |
| Always partial failure | No way to throw on first error |

### Decision

Partial failure by default, with `failFast: true` as an opt-in. Rationale: video transcoding pipelines in production (YouTube, Cloudflare Stream, Mux) never abort an entire batch because one variant failed. The user almost always wants the other 90% of their work to succeed. `failFast: true` is there for CI pipelines and testing where you want strict validation.

---

## ADR-007 — ESM vs CJS: Output and Source Format

**Date:** Package config phase
**Status:** Accepted

### Context

The npm ecosystem is in a mixed ESM/CJS transition. Libraries need to serve both.

### Decision

- **Source:** Native ESM (`"type": "module"` in package.json)
- **Output:** Dual `exports` — `.js` for ESM consumers, `.cjs` for CommonJS consumers
- **Minimum Node:** 18 (first LTS with stable native ESM `--experimental-vm-modules` no longer needed)

This gives modern consumers tree-shaking and clean imports while not breaking legacy `require()` usage in older projects.

---

## ADR-008 — HLS Segment Format: fMP4 default over MPEG-TS

**Date:** FFmpeg strategy phase
**Status:** Accepted

### Context

HLS can use either legacy `.ts` (MPEG-TS) segments or modern `.mp4` (fragmented MP4 / fMP4) segments.

### Options Considered

| Format | Pros | Cons |
|--------|------|------|
| **fMP4 (default)** | Smaller segments, CMAF-compatible, modern standard | Requires iOS 10+, HLS version 7 |
| MPEG-TS (`ts` fallback) | Works on very old players | Larger, no CMAF support |

### Decision

fMP4 by default because virtually all relevant devices support it (iOS 10 was released in 2016). Legacy `.ts` is available via `segmentFormat: 'ts'` for anyone who needs it. Defaulting to the better technology pushes the ecosystem forward.

---

## ADR-009 — Thumbnails: Filter Graph vs Seek-and-Grab

**Date:** FFmpeg strategy phase
**Status:** Accepted

### Context

Two main approaches to thumbnail extraction:

1. **Seek-and-grab**: Run FFmpeg N times, each with `-ss` to seek to a timestamp
2. **Filter graph**: Run FFmpeg once, use `select=` filter to pick frames

### Decision

Filter graph (single-pass) approach for all thumbnails. Rationale:
- One FFmpeg process vs N processes for N thumbnails
- Significantly faster for many thumbnails
- Evenly-spaced timestamps are cleaner as a filter expression
- Seek-and-grab can have keyframe inaccuracy issues

---

## ADR-010 — No Streaming Output in v1

**Date:** Scope definition
**Status:** Accepted

### Context

Some use cases want to pipe video output to a network stream or cloud storage without writing to disk.

### Decision

Out of scope for v1. File-to-file is the 90% use case and the architecture for streaming output is fundamentally different (requires async iterables, backpressure management). Shipping v1 with streaming would delay the release and complicate the API significantly. This is tracked as a v2 feature in [ROADMAP.md](./ROADMAP.md).
