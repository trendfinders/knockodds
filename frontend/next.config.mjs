/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io', pathname: '/mma/**' },
      { protocol: 'https', hostname: 'media-1.api-sports.io', pathname: '/mma/**' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'media.knockodds.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.vox-cdn.com' },
      { protocol: 'https', hostname: '*.mmafighting.com' },
      { protocol: 'https', hostname: '*.usatoday.com' },
      { protocol: 'https', hostname: '*.gannett-cdn.com' },
      { protocol: 'https', hostname: '*.sherdog.com' },
      { protocol: 'https', hostname: '*.wp.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['openai'],
    staleTimes: {
      dynamic: 0,
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
