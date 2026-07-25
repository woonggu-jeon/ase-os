import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3001';

const config: NextConfig = {
  // Consume the workspace types/utility package directly.
  transpilePackages: ['@ase-os/shared'],
  // Proxy API calls to the NestJS backend (see ADR 0003). NOTE: Next's dev proxy
  // caps request bodies at 10 MB, so the browser uploads videos DIRECTLY to the API
  // (NEXT_PUBLIC_API_BASE, with CORS) instead of through this rewrite. Other calls
  // also use the API base; the rewrite remains for same-origin server-side use.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default config;
