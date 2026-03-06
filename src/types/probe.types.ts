/**
 * Metadata extracted from ffprobe about the input video.
 */
export interface VideoProbe {
  /** Duration in seconds */
  duration: number;

  /** Video width in pixels */
  width: number;

  /** Video height in pixels */
  height: number;

  /** Frames per second */
  fps: number;

  /** Whether the input has an audio stream */
  hasAudio: boolean;

  /** Video codec name, e.g. 'h264' */
  videoCodec: string;

  /** Audio codec name, e.g. 'aac' (empty string if no audio) */
  audioCodec: string;

  /** Overall bitrate in kbps */
  bitrate: number;

  /** File size in bytes */
  size: number;
}
