import path from 'node:path';

const THUMBNAILS_ROOT = path.resolve(process.cwd(), 'data', 'thumbnails');

/** Directory holding a video's scene thumbnails. */
export function thumbnailsDir(videoId: string): string {
  return path.join(THUMBNAILS_ROOT, videoId);
}

/** Absolute path of a single scene thumbnail. */
export function thumbnailPath(videoId: string, index: number): string {
  return path.join(thumbnailsDir(videoId), `${index}.jpg`);
}
