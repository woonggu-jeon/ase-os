import { run } from './run';

export interface MediaInfo {
  readonly durationSec: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly videoCodec: string | null;
  readonly hasAudio: boolean;
}

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
}
interface FfprobeOutput {
  format?: { duration?: string };
  streams?: FfprobeStream[];
}

/** Extract basic media metadata from a local file using ffprobe (free/offline). */
export async function probeMedia(mediaPath: string): Promise<MediaInfo> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height',
    '-of',
    'json',
    mediaPath,
  ]);

  const parsed = JSON.parse(stdout) as FfprobeOutput;
  const streams = parsed.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video');

  return {
    durationSec: Number(parsed.format?.duration ?? 0) || 0,
    width: video?.width ?? null,
    height: video?.height ?? null,
    videoCodec: video?.codec_name ?? null,
    hasAudio: streams.some((s) => s.codec_type === 'audio'),
  };
}
