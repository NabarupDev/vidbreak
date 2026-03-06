# Filename: ARCHITECTURE.md

# vidbreak — Architecture

> Internal design, module structure, and system flow

---

## Overview

vidbreak is a TypeScript-first FFmpeg orchestration library. It sits as a thin, intelligent layer above raw FFmpeg processes — providing a clean async API, structured output, typed events, and smart concurrency management.

```
┌──────────────────────────────────────────────────────────┐
│                      Public API Layer                    │
│         vidbreak()  /  VidbreakBuilder  /  Presets       │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                    Job Planner / Resolver                 │
│   Resolves options → ordered list of FFmpeg Job specs    │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                    Concurrency Scheduler                  │
│     p-limit based queue, respects maxConcurrent option   │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                     FFmpeg Process Runner                 │
│   Spawns child_process, parses stderr, emits progress    │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                      Output Collector                     │
│   Gathers file paths, sizes, durations → VidbreakResult  │
└──────────────────────────────────────────────────────────┘
```

---

## Module Map

```
src/
├── index.ts                  ← Public exports
├── vidbreak.ts               ← Main entry: vidbreak() function
├── builder/
│   └── VidbreakBuilder.ts    ← Chainable builder class
├── planner/
│   ├── JobPlanner.ts         ← Converts options to job list
│   ├── ResolutionResolver.ts ← Handles resolution strings → WxH
│   └── FormatResolver.ts     ← Maps format names to codec params
├── scheduler/
│   └── ConcurrencyScheduler.ts ← p-limit queue wrapper
├── runner/
│   ├── FFmpegRunner.ts       ← Spawns + monitors FFmpeg processes
│   ├── ProgressParser.ts     ← Parses FFmpeg stderr output
│   └── BinaryLocator.ts      ← Finds ffmpeg binary (PATH / ffmpeg-static)
├── encoders/
│   ├── VideoEncoder.ts       ← Video encoding job builder
│   ├── AudioEncoder.ts       ← Audio extraction job builder
│   ├── HLSEncoder.ts         ← HLS segmenting + m3u8 generation
│   └── ThumbnailEncoder.ts   ← Frame extraction for thumbnails
├── presets/
│   ├── index.ts              ← Re-exports all presets
│   ├── web.preset.ts         ← H.264 + AAC preset
│   ├── hq.preset.ts          ← H.265/HEVC preset
│   ├── av1.preset.ts         ← AV1 (libaom / SVT-AV1) preset
│   ├── webm.preset.ts        ← VP9 + Opus preset
│   └── hls.preset.ts         ← HLS adaptive preset
├── types/
│   ├── options.types.ts      ← VidbreakOptions, all sub-options
│   ├── result.types.ts       ← VidbreakResult, OutputFile
│   ├── job.types.ts          ← Internal job specs
│   └── events.types.ts       ← Typed event names + payloads
├── utils/
│   ├── probeVideo.ts         ← ffprobe wrapper for input metadata
│   ├── ensureDir.ts          ← mkdir -p wrapper
│   ├── formatBytes.ts        ← Human-readable file sizes
│   └── timeToSeconds.ts      ← HH:MM:SS → number
└── errors/
    ├── VidbreakError.ts      ← Base error class
    ├── FFmpegNotFoundError.ts
    └── EncodingError.ts
```

---

## Data Flow: Step by Step

### 1. Input Probing

Before any jobs are created, `probeVideo()` runs `ffprobe` on the input file and returns:

```ts
interface VideoProbe {
  duration: number;       // seconds
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  videoCodec: string;
  audioCodec: string;
  bitrate: number;        // kbps
  size: number;           // bytes
}
```

This data is used to:
- Filter out resolutions larger than the source
- Skip audio jobs if no audio stream exists
- Inform thumbnail timestamps
- Validate that output presets are achievable

---

### 2. Job Planning

`JobPlanner` receives `VidbreakOptions` + probe results and emits a flat list of `FFmpegJob[]`:

```ts
interface FFmpegJob {
  id: string;
  type: 'video' | 'audio' | 'hls' | 'thumbnail';
  inputPath: string;
  outputPath: string;
  args: string[];          // Raw FFmpeg CLI args
  label: string;           // Human-readable name for progress display
  estimatedWeight: number; // For progress calculation (1–10)
}
```

Jobs are ordered: video → audio → HLS → thumbnails (thumbnails last as they're cheapest).

---

### 3. Concurrency Scheduling

A `p-limit` queue wraps all job execution. Default concurrency is `2` (respects most systems). Users can override:

```ts
vidbreak(input, { maxConcurrent: 4 })
```

HLS jobs are always serialised (single-threaded) due to FFmpeg segment file contention.

---

### 4. FFmpeg Process Execution

`FFmpegRunner` spawns each job as a `child_process.spawn()`:

```ts
spawn(binaryPath, job.args, { stdio: ['ignore', 'ignore', 'pipe'] })
```

stderr is piped and fed to `ProgressParser` line by line. Key parsed fields:
- `frame=` → current frame
- `time=` → encoded duration
- `speed=` → encoding speed multiplier
- `size=` → current output file size

These are combined into a `ProgressEvent`:

```ts
interface ProgressEvent {
  jobId: string;
  label: string;
  percent: number;         // 0–100 computed from time/duration
  fps: number;
  speed: number;
  eta: number;             // seconds
  currentSize: number;     // bytes
}
```

---

### 5. Result Collection

After all jobs complete, `OutputCollector` walks the output directory and builds `VidbreakResult`:

```ts
interface VidbreakResult {
  success: boolean;
  duration: number;         // total wall clock time (ms)
  files: OutputFile[];
  hls?: HLSResult;
  errors: EncodingError[];  // partial failures captured here
}

interface OutputFile {
  type: 'video' | 'audio' | 'thumbnail';
  format: string;
  resolution?: string;
  path: string;
  size: number;
  bitrate?: number;
}
```

---

## Error Handling Philosophy

vidbreak uses a **partial-failure model**: if one encoding job fails (e.g. AV1 is unsupported on the machine), the rest continue. Errors are collected in `result.errors[]`. The top-level promise only rejects if all jobs fail or a fatal error occurs (e.g. FFmpeg not found, unreadable input).

```ts
try {
  const result = await vidbreak('./input.mp4', options);
  if (result.errors.length) {
    console.warn('Some jobs failed:', result.errors);
  }
} catch (err) {
  // Fatal: FFmpeg not found, file unreadable, etc.
}
```

---

## Events Architecture

`VidbreakBuilder` extends `EventEmitter` and emits typed events:

```ts
builder.on('progress', (e: ProgressEvent) => { ... });
builder.on('job:start', (e: JobStartEvent) => { ... });
builder.on('job:done', (e: JobDoneEvent) => { ... });
builder.on('job:error', (e: JobErrorEvent) => { ... });
builder.on('done', (result: VidbreakResult) => { ... });
```

The one-shot `vidbreak()` function also accepts an optional `onProgress` callback:

```ts
await vidbreak('./input.mp4', {
  ...options,
  onProgress: (e) => console.log(`${e.label}: ${e.percent}%`),
});
```

---

## Binary Detection Strategy

Priority order for finding FFmpeg:

1. `options.ffmpegPath` — explicit user override
2. `process.env.FFMPEG_PATH` — environment variable
3. `ffmpeg-static` package (if installed in project)
4. System PATH (`which ffmpeg` / `where ffmpeg` on Windows)

If none found → throw `FFmpegNotFoundError` with actionable install instructions.

---

## Key Design Decisions

### Why `child_process.spawn` not `execa`?

- Zero extra dependency
- Direct stderr streaming without buffering
- Fine-grained process lifecycle control

### Why `p-limit` for concurrency?

- Tiny (0 transitive deps)
- Simple Promise-based API that fits our scheduler perfectly

### Why partial-failure model?

- Encoding pipelines in production should not abort 10 minutes of work because AV1 is slow
- Mirrors how video platforms (YouTube, Cloudflare Stream) handle transcoding queues

### Why no streaming output API (yet)?

- v1 targets file-to-file workflows (the 90% use case)
- Streaming pipes are planned for v2 (see ROADMAP.md)
