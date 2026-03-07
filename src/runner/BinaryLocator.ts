import { execFileSync, execSync } from 'node:child_process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { FFmpegNotFoundError } from '../errors/FFmpegNotFoundError.js';

const execFileAsync = promisify(execFile);

export interface BinaryPaths {
  ffmpeg: string;
  ffprobe: string;
}

/**
 * Attempt to resolve the path of a binary by name using system PATH lookup.
 */
function whichSync(name: string): string | null {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const firstLine = result.trim().split('\n')[0];
    return firstLine?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Try to require ffmpeg-static and return its path.
 */
function tryFFmpegStatic(): string | null {
  try {
    // Dynamic import fallback for ffmpeg-static
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStaticPath = require('ffmpeg-static') as string;
    return ffmpegStaticPath;
  } catch {
    return null;
  }
}

/**
 * Try to require @ffprobe-installer/ffprobe and return its path.
 */
function tryFFprobeInstaller(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const installer = require('@ffprobe-installer/ffprobe') as { path: string };
    return installer.path;
  } catch {
    return null;
  }
}

/**
 * Locate FFmpeg and ffprobe binaries using the priority order:
 * 1. Explicit options
 * 2. Environment variables
 * 3. ffmpeg-static package
 * 4. System PATH
 *
 * @throws FFmpegNotFoundError if neither binary can be found
 */
export async function locateBinaries(options?: {
  ffmpegPath?: string;
  ffprobePath?: string;
}): Promise<BinaryPaths> {
  let ffmpeg: string | null = null;
  let ffprobe: string | null = null;

  // 1. Explicit paths
  if (options?.ffmpegPath) {
    ffmpeg = options.ffmpegPath;
  }
  if (options?.ffprobePath) {
    ffprobe = options.ffprobePath;
  }

  // 2. Environment variables
  if (!ffmpeg && process.env['FFMPEG_PATH']) {
    ffmpeg = process.env['FFMPEG_PATH'];
  }
  if (!ffprobe && process.env['FFPROBE_PATH']) {
    ffprobe = process.env['FFPROBE_PATH'];
  }

  // 3. Bundled binaries (ffmpeg-static / @ffprobe-installer/ffprobe)
  if (!ffmpeg) {
    const staticPath = tryFFmpegStatic();
    if (staticPath) {
      ffmpeg = staticPath;
    }
  }
  if (!ffprobe) {
    const probePath = tryFFprobeInstaller();
    if (probePath) {
      ffprobe = probePath;
    }
  }

  // 4. System PATH
  if (!ffmpeg) {
    ffmpeg = whichSync('ffmpeg');
  }
  if (!ffprobe) {
    ffprobe = whichSync('ffprobe');
  }

  if (!ffmpeg) {
    throw new FFmpegNotFoundError();
  }

  // Default ffprobe to same directory as ffmpeg if not found
  if (!ffprobe) {
    const ffmpegDir = ffmpeg.replace(/ffmpeg(\.exe)?$/i, '');
    const probeName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    ffprobe = ffmpegDir + probeName;
  }

  return { ffmpeg, ffprobe };
}

/**
 * Check the FFmpeg version and ensure it meets the minimum requirement (5.0).
 *
 * @param binaryPath - Path to the ffmpeg binary
 * @returns The version string (e.g. '6.1.1')
 * @throws VidbreakError if version is below 5.0
 */
export async function checkFFmpegVersion(binaryPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(binaryPath, ['-version']);
    // Parse: "ffmpeg version 6.1.1 Copyright ..."
    const match = /ffmpeg version (\d+\.\d+(?:\.\d+)?)/.exec(stdout);

    if (!match?.[1]) {
      return 'unknown';
    }

    const version = match[1];
    const major = parseInt(version.split('.')[0] ?? '0', 10);

    if (major < 5) {
      const { VidbreakError } = await import('../errors/VidbreakError.js');
      throw new VidbreakError(
        `FFmpeg version ${version} is below the minimum required version 5.0. Please upgrade FFmpeg.`,
        'FFMPEG_VERSION_TOO_OLD',
      );
    }

    return version;
  } catch (err: unknown) {
    // Re-throw our own errors
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'FFMPEG_VERSION_TOO_OLD') {
      throw err;
    }
    // ffmpeg -version failed entirely
    const { VidbreakError } = await import('../errors/VidbreakError.js');
    throw new VidbreakError(
      `Failed to check FFmpeg version at "${binaryPath}". Ensure FFmpeg is installed correctly.`,
      'FFMPEG_VERSION_CHECK_FAILED',
    );
  }
}
