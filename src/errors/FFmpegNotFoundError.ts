import { VidbreakError } from './VidbreakError.js';

function getInstallInstructions(): string {
  const platform = process.platform;
  const lines = [
    'FFmpeg was not found on this system.',
    '',
    'Install FFmpeg using one of the following methods:',
  ];

  if (platform === 'darwin') {
    lines.push('  macOS:   brew install ffmpeg');
  } else if (platform === 'linux') {
    lines.push('  Linux:   apt install ffmpeg');
  } else if (platform === 'win32') {
    lines.push('  Windows: choco install ffmpeg');
  }

  // Always include all options for cross-platform awareness
  if (platform !== 'darwin') lines.push('  macOS:   brew install ffmpeg');
  if (platform !== 'linux') lines.push('  Linux:   apt install ffmpeg');
  if (platform !== 'win32') lines.push('  Windows: choco install ffmpeg');

  lines.push('  Any OS:  npm install ffmpeg-static');

  return lines.join('\n');
}

/**
 * Thrown when the FFmpeg binary cannot be located.
 */
export class FFmpegNotFoundError extends VidbreakError {
  constructor() {
    super(getInstallInstructions(), 'FFMPEG_NOT_FOUND');
    this.name = 'FFmpegNotFoundError';
  }
}
