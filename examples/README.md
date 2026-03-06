# vidbreak Examples

Practical examples showing how to use every feature of **vidbreak**.

## Prerequisites

```bash
npm install vidbreak
```

FFmpeg must be installed on your system:

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# Windows
choco install ffmpeg

# Or use the bundled binary (zero config)
npm install ffmpeg-static
```

## Running Examples

Each example is a standalone TypeScript file. Run with [tsx](https://github.com/privatenumber/tsx):

```bash
npx tsx examples/01-basic-conversion.ts
```

Place an `input.mp4` file in the project root (or update the path in each example).

## Examples

| # | File | Description |
|---|------|-------------|
| 01 | `01-basic-conversion.ts` | Convert a video to MP4 at 720p |
| 02 | `02-multi-format.ts` | Multiple formats (MP4, WebM, AV1) and resolutions |
| 03 | `03-hls-streaming.ts` | HLS adaptive streaming with master playlist |
| 04 | `04-audio-extraction.ts` | Extract audio to MP3, AAC, Opus |
| 05 | `05-thumbnails.ts` | Generate thumbnails (count or timestamps) |
| 06 | `06-progress-events.ts` | Real-time progress tracking (callback & events) |
| 07 | `07-builder-api.ts` | Fluent builder API with full chaining |
| 08 | `08-presets.ts` | Encoding presets (web, fast, archive, etc.) |
| 09 | `09-error-handling.ts` | Typed error handling with all error classes |
| 10 | `10-kitchen-sink.ts` | Full pipeline: video + HLS + audio + thumbnails |

## Two API Styles

### One-shot function (simplest)

```ts
import { vidbreak } from 'vidbreak';

const result = await vidbreak('./input.mp4', {
  formats: ['mp4'],
  resolutions: ['720p'],
  output: './output',
});
```

### Chainable builder (full control)

```ts
import { VidbreakBuilder } from 'vidbreak';

const result = await new VidbreakBuilder('./input.mp4')
  .format('mp4', 'webm')
  .resolution('1080p', '720p')
  .preset('web')
  .output('./output')
  .run();
```
