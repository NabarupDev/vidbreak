import { stat } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FFmpegJob } from '../types/job.types.js';
import type { VideoProbe } from '../types/probe.types.js';
import type { VidbreakResult, OutputFile, HLSResult, HLSVariant } from '../types/result.types.js';
import type { EncodingError } from '../errors/EncodingError.js';

/**
 * Collect results from completed jobs, stat output files, and assemble VidbreakResult.
 */
export async function collectResults(
  jobs: FFmpegJob[],
  errors: EncodingError[],
  probe: VideoProbe,
  startTime: number,
): Promise<VidbreakResult> {
  const files: OutputFile[] = [];
  let hlsResult: HLSResult | undefined;

  const completedJobs = jobs;

  for (const job of completedJobs) {
    if (job.type === 'video') {
      try {
        const stats = await stat(job.outputPath);
        files.push({
          type: 'video',
          format: extractFormat(job.outputPath),
          resolution: extractResolution(job.label),
          path: job.outputPath,
          size: stats.size,
        });
      } catch {
        // File may not exist if job was partially completed
      }
    } else if (job.type === 'audio') {
      try {
        const stats = await stat(job.outputPath);
        files.push({
          type: 'audio',
          format: extractFormat(job.outputPath),
          path: job.outputPath,
          size: stats.size,
        });
      } catch {
        // Skip missing files
      }
    } else if (job.type === 'thumbnail') {
      // Thumbnails output to a directory — find all generated files
      try {
        const thumbFiles = await readdir(job.outputPath);
        for (const file of thumbFiles) {
          const filePath = join(job.outputPath, file);
          const stats = await stat(filePath);
          files.push({
            type: 'thumbnail',
            format: extractFormat(file),
            path: filePath,
            size: stats.size,
          });
        }
      } catch {
        // Directory may not exist
      }
    } else if (job.type === 'hls') {
      // Collect HLS variant info
      if (!hlsResult) {
        // Find the master playlist path — will be set after processing all HLS jobs
        const hlsDir = job.outputPath.replace(/[/\\][^/\\]+[/\\]stream\.m3u8$/, '');
        hlsResult = {
          masterPlaylist: join(hlsDir, 'master.m3u8'),
          variants: [],
        };
      }

      try {
        const variant = await collectHLSVariant(job);
        if (variant) {
          hlsResult.variants.push(variant);
        }
      } catch {
        // Skip on error
      }
    }
  }

  const duration = Date.now() - startTime;

  const result: VidbreakResult = {
    success: errors.length === 0,
    duration,
    files,
    errors,
    probe,
  };

  if (hlsResult) {
    result.hls = hlsResult;
  }

  return result;
}

/**
 * Extract file extension as format name.
 */
function extractFormat(filePath: string): string {
  const ext = filePath.split('.').pop() ?? '';
  return ext.toLowerCase();
}

/**
 * Extract resolution label from job label (e.g. "MP4 1080p" → "1080p").
 */
function extractResolution(label: string): string {
  const parts = label.split(' ');
  return parts[parts.length - 1] ?? '';
}

/**
 * Collect HLS variant information from a completed HLS job.
 */
async function collectHLSVariant(job: FFmpegJob): Promise<HLSVariant | null> {
  const playlistPath = job.outputPath;
  const variantDir = playlistPath.replace(/[/\\]stream\.m3u8$/, '');
  const resolution = extractResolution(job.label);

  try {
    const playlistContent = await readFile(playlistPath, 'utf-8');
    const segments: string[] = [];

    for (const line of playlistContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        segments.push(join(variantDir, trimmed));
      }
    }

    // Estimate bandwidth from segments
    let totalSize = 0;
    for (const seg of segments) {
      try {
        const segStat = await stat(seg);
        totalSize += segStat.size;
      } catch {
        // Skip missing segments
      }
    }

    // Calculate bandwidth in bits/s (rough estimate)
    const segmentDuration = 6; // Default
    const bandwidth = segments.length > 0
      ? Math.round((totalSize * 8) / (segments.length * segmentDuration))
      : 0;

    return {
      resolution,
      bandwidth,
      playlist: playlistPath,
      segments,
    };
  } catch {
    return null;
  }
}
