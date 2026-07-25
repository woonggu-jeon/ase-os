// Domain layer: types and rules only. No framework, no I/O.

export interface Video {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  /** Absolute path on local disk. Internal — never exposed over HTTP. */
  readonly storedPath: string;
  /** ISO-8601 timestamp. */
  readonly uploadedAt: string;
}

/** Maximum accepted upload size for the local MVP: 500 MB. */
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo',
] as const;

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export function isAllowedVideoMimeType(mime: string): mime is AllowedVideoMimeType {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}

/** HTTP-safe view of a Video. Excludes the internal storage path. */
export interface VideoView {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: string;
}

export function toVideoView(video: Video): VideoView {
  return {
    id: video.id,
    originalName: video.originalName,
    mimeType: video.mimeType,
    sizeBytes: video.sizeBytes,
    uploadedAt: video.uploadedAt,
  };
}
