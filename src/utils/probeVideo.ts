import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ProbeError } from '../errors/ProbeError.js';
import type { VideoProbe } from '../types/probe.types.js';

const execFileAsync = promisify(execFile);

interface FFprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  bit_rate?: string;
}

interface FFprobeFormat {
  duration?: string;
  bit_rate?: string;
  size?: string;
}

interface FFprobeOutput {
  streams?: FFprobeStream[];
  format?: FFprobeFormat;
}

/**
 * Probe a video file using ffprobe and return structured metadata.
 *
 * @param inputPath - Path to the input video file
 * @param ffprobePath - Optional path to the ffprobe binary
 * @returns Structured video metadata
 * @throws ProbeError if ffprobe fails
 */
export async function probeVideo(
  inputPath: string,
  ffprobePath = 'ffprobe',
): Promise<VideoProbe> {
  let stdout: string;
  try {
    const result = await execFileAsync(ffprobePath, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      inputPath,
    ]);
    stdout = result.stdout;
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    throw new ProbeError(inputPath, stderr);
  }

  const data = JSON.parse(stdout) as FFprobeOutput;
  const streams = data.streams ?? [];
  const format = data.format;

  const videoStream = streams.find((s) => s.codec_type === 'video');
  const audioStream = streams.find((s) => s.codec_type === 'audio');

  if (!videoStream) {
    throw new ProbeError(inputPath, 'No video stream found in input file.');
  }

  // Parse frame rate from "30/1" or "30000/1001" format
  let fps = 30;
  if (videoStream.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split('/');
    if (num && den) {
      fps = parseFloat(num) / parseFloat(den);
    }
  }

  return {
    duration: parseFloat(format?.duration ?? '0'),
    width: videoStream.width ?? 0,
    height: videoStream.height ?? 0,
    fps: Math.round(fps * 100) / 100,
    hasAudio: audioStream !== undefined,
    videoCodec: videoStream.codec_name ?? '',
    audioCodec: audioStream?.codec_name ?? '',
    bitrate: Math.round(parseFloat(format?.bit_rate ?? '0') / 1000),
    size: parseInt(format?.size ?? '0', 10),
  };
}
