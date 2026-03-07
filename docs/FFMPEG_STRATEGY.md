# Filename: FFMPEG_STRATEGY.md

# vidbreak — FFmpeg Strategy

> Encoding decisions, codec choices, flag rationale, and quality tuning

---

## Philosophy

vidbreak's FFmpeg strategy prioritises:

1. **Correctness first** — Outputs that play everywhere, always
2. **Sane defaults** — Good quality at reasonable file sizes out of the box
3. **Transparency** — Every default flag is documented with a reason
4. **Overridability** — Every decision can be overridden via `extraArgs`

---

## Binary Detection

```
Priority order:
1. options.ffmpegPath (explicit user override)
2. process.env.FFMPEG_PATH (environment variable)
3. Bundled binaries (ffmpeg-static + @ffprobe-installer/ffprobe — installed as dependencies)
4. which ffmpeg (system PATH — cross-platform)
```

FFmpeg is bundled as a direct dependency via `ffmpeg-static`, so users never need to install it manually. The bundled binary is used automatically unless overridden.

Minimum required FFmpeg version: **5.0** (for AV1/fMP4 HLS support).

Version is checked on startup via `ffmpeg -version` and a helpful error is thrown if below minimum.

---

## Codec Matrix

| Format | Video Codec | Audio Codec | Container | Notes |
|--------|-------------|-------------|-----------|-------|
| `mp4` | libx264 | aac | MP4 | Widest compatibility |
| `mp4-hevc` | libx265 | aac | MP4 | Smaller files, less compatible |
| `webm` | libvpx-vp9 | libopus | WebM | Open standard |
| `av1` | libaom-av1 | libopus | MP4/WebM | Best compression, slow |
| `mkv` | libx265 | aac | MKV | Archival quality |
| `mov` | libx264 | aac | MOV | Apple ecosystem |
| `gif` | gif (palettegen) | N/A | GIF | Legacy, use sparingly |
| HLS | libx264 | aac | TS/fMP4 | Adaptive streaming |

---

## Preset Definitions

### `web` — Broadest Compatibility

Target: 90% of viewers on any device/browser.

```
Video: libx264 -crf 23 -preset medium -profile:v high -level 4.0
       -movflags +faststart -pix_fmt yuv420p
Audio: aac -b:a 128k -ar 44100
```

**Flag rationale:**
- `-crf 23` — Industry standard for near-transparent quality
- `-preset medium` — Balanced speed vs compression efficiency
- `-profile:v high -level 4.0` — Compatible with all modern devices including smart TVs
- `-movflags +faststart` — Moves moov atom to start of file for instant web playback
- `-pix_fmt yuv420p` — Forces 8-bit 4:2:0 chroma for maximum player compatibility

---

### `hq` — High Quality (H.265)

Target: Modern devices where file size matters (streaming platforms, VOD).

```
Video: libx265 -crf 28 -preset medium -tag:v hvc1
       -movflags +faststart -pix_fmt yuv420p
Audio: aac -b:a 192k -ar 48000
```

**Flag rationale:**
- `-crf 28` — Equivalent visual quality to H.264 CRF 23 at ~40% smaller size
- `-tag:v hvc1` — Required for H.265 in MP4 to play on Apple devices
- `-ar 48000` — 48kHz sample rate matches broadcast/streaming standards

---

### `av1` — Maximum Compression

Target: Streaming platforms, CDN-delivered content at scale.

```
Video: libaom-av1 -crf 30 -b:v 0 -cpu-used 4 -row-mt 1 -tiles 2x2
Audio: libopus -b:a 128k -vbr on
```

**Flag rationale:**
- `-b:v 0` — Enables CRF (quality-based) mode for libaom
- `-cpu-used 4` — Speed/quality tradeoff (0=slowest/best, 8=fastest/worst). 4 is practical for batch encoding
- `-row-mt 1` — Multi-threaded row encoding (significant speedup on multi-core)
- `-tiles 2x2` — Parallel tile encoding for further speedup
- `libopus -vbr on` — Variable bitrate Opus for best audio quality/size

**Note on SVT-AV1:** If `libsvtav1` is detected at runtime, vidbreak automatically switches to it over `libaom-av1` — it's 10–40× faster with comparable quality.

---

### `webm` — Open Web Standard

Target: Open-source-first deployments, browsers without H.264 licensing concerns.

```
Video: libvpx-vp9 -crf 31 -b:v 0 -deadline good -cpu-used 2
       -row-mt 1 -tile-columns 2
Audio: libopus -b:a 128k -vbr on
```

**Flag rationale:**
- `-crf 31 -b:v 0` — CRF mode (constrained quality, similar to AV1 approach)
- `-deadline good -cpu-used 2` — VP9 speed setting (good = quality-first, 2 = reasonable speed)

---

### `fast` — Speed-Optimised

Target: Development, previews, quick-turnaround transcodes.

```
Video: libx264 -crf 28 -preset ultrafast
Audio: aac -b:a 96k
```

---

### `archive` — Near-Lossless

Target: Long-term storage, master files.

```
Video: libx264 -crf 14 -preset veryslow
Audio: flac (lossless)
```

---

### `mobile` — Bandwidth-Constrained

Target: Mobile data users, developing-world connectivity.

```
Video: libx264 -crf 26 -preset medium -profile:v baseline -level 3.0
       -maxrate 800k -bufsize 1200k
Audio: aac -b:a 96k -ar 44100
```

**Flag rationale:**
- `-profile:v baseline` — Maximum hardware decoder compatibility on older phones
- `-maxrate -bufsize` — Hard bitrate ceiling to prevent spikes over mobile bandwidth

---

## Resolution Handling

### Named Resolution Map

```
4k    → 3840:-2    (preserves aspect ratio, rounds to even)
2k    → 2560:-2
1080p → 1920:-2
720p  → 1280:-2
480p  → 854:-2
360p  → 640:-2
240p  → 426:-2
```

Using `-2` instead of a fixed height lets FFmpeg calculate the correct height while keeping it even (required by most codecs). This handles portrait videos automatically.

### Source Guard

Before emitting a job, vidbreak checks: `targetWidth > sourceWidth → skip job`.

This prevents upscaling (which wastes storage and looks worse than the original).

```ts
// Example: 720p source → only 720p and below are encoded
resolutions: ['1080p', '720p', '480p']
// → Actually runs: ['720p', '480p']  (1080p silently skipped)
```

---

## HLS Strategy

### Segment Format Choice

vidbreak defaults to **fMP4 segments** (not `.ts`):

- fMP4 is natively supported by all modern players (iOS 10+, Android, browsers)
- Smaller segments due to better container efficiency
- Required for CMAF (a unified HLS/DASH format)
- Use `segmentFormat: 'ts'` to fall back to legacy `.ts` for old players

### Bitrate Ladder (auto-generated)

HLS generates a bitrate ladder from the requested resolutions:

| Resolution | Video Bitrate | Audio Bitrate |
|-----------|--------------|--------------|
| 1080p | 4000k | 128k |
| 720p | 2500k | 128k |
| 480p | 1200k | 96k |
| 360p | 700k | 96k |
| 240p | 400k | 64k |

These are targets — the `-maxrate` and `-bufsize` flags (set to 1.5× target bitrate) allow ABR to work correctly.

### Master Playlist Generation

```m3u8
#EXTM3U
#EXT-X-VERSION:6

#EXT-X-STREAM-INF:BANDWIDTH=4128000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/stream.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720p/stream.m3u8
```

The `CODECS` field is calculated from the actual encoding parameters to satisfy strict MIME type validation in some CDNs.

---

## Audio Extraction

### Format Flag Map

| Format | Flags |
|--------|-------|
| mp3 | `-codec:a libmp3lame -q:a 2` (VBR ~190kbps) |
| aac | `-codec:a aac -b:a 192k` |
| opus | `-codec:a libopus -b:a 160k -vbr on` |
| flac | `-codec:a flac` |
| wav | `-codec:a pcm_s16le` |
| ogg | `-codec:a libvorbis -q:a 6` |

Audio is extracted with `-vn` (no video) for speed.

---

## Thumbnail Strategy

```bash
ffmpeg -i input.mp4 \
  -vf "select=not(mod(n\,FRAME_INTERVAL)),scale=320:-2,setpts=N/TB" \
  -vsync vfr \
  -frames:v COUNT \
  thumb_%02d.jpg
```

- Selects evenly spaced frames across the full duration
- Skips the first and last 5% of the video (often blank/logo frames)
- `-vsync vfr` prevents duplicate frames in the output

---

## Hardware Acceleration

### NVENC (NVIDIA)

```bash
# Detection test
ffmpeg -encoders | grep nvenc

# Replacement codec map
libx264 → h264_nvenc -preset p4 -tune hq -rc vbr -cq 23
libx265 → hevc_nvenc -preset p4 -tune hq -rc vbr -cq 28
```

### VideoToolbox (Apple Silicon / macOS)

```bash
libx264 → h264_videotoolbox -q:v 65
libx265 → hevc_videotoolbox -q:v 65
```

### VAAPI (Linux / Intel / AMD)

```bash
ffmpeg -vaapi_device /dev/dri/renderD128 \
  -hwaccel vaapi -hwaccel_output_format vaapi \
  -vf "format=nv12|vaapi,hwupload" \
  -c:v h264_vaapi -qp 23
```

### Auto-Detection Logic

`hwAccel: 'auto'` runs a series of probe jobs on startup to find the fastest available acceleration. Priority: `nvenc > videotoolbox > qsv > vaapi > software`.

---

## Process Management

### Graceful Cancellation

All `FFmpegRunner` instances register a process handle. When `builder.abort()` is called:
1. All queued jobs are drained
2. Running FFmpeg processes receive `SIGTERM`
3. Partial output files are deleted
4. The promise rejects with `AbortError`

### Timeout Handling

A per-job timeout (default: none, configurable) kills a stuck FFmpeg process after N seconds of no stderr output.
