// Base URL for API calls. The browser talks to the NestJS API directly (not via the
// Next dev proxy) so large uploads aren't capped by Next's 10 MB proxy body limit.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
