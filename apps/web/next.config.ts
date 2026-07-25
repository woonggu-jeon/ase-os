import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3001';

const config: NextConfig = {
  // Consume the workspace types/utility package directly.
  transpilePackages: ['@ase-os/shared'],
  // Proxy API calls to the NestJS backend during development (see ADR 0003).
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default config;
