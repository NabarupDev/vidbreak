import { VidbreakError } from './VidbreakError.js';

function getInstallInstructions(): string {
  const lines = [
    'FFmpeg was not found on this system.',
    '',
    'vidbreak bundles FFmpeg automatically via ffmpeg-static.',
    'If you see this error, try reinstalling:',
    '',
    '  npm install vidbreak',
    '',
    'If the bundled binary doesn\'t work on your platform, install FFmpeg manually:',
    '',
    '  macOS:   brew install ffmpeg',
    '  Linux:   sudo apt install ffmpeg',
    '  Windows: choco install ffmpeg',
  ];

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
