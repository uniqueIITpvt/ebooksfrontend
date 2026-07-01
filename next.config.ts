// Single Next.js config for both local development and production.
// Defaults to the deployed backend. To use a local API, set NEXT_PUBLIC_API_URL.
// To force a backend in any environment, set NEXT_PUBLIC_API_URL before running Next.

const PRODUCTION_API_URL = 'https://ebooksbackend-production.up.railway.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;

const nextConfig = {
  transpilePackages: ['swiper'],
  images: {
    qualities: [75, 85, 95, 100],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      // {
      //   protocol: 'https',
      //   hostname: 'ebookbackend.vercel.app',
      // },
      {
        protocol: 'https',
        hostname: 'ebooksbackend-production.up.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
