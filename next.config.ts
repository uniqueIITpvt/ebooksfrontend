// Single Next.js config for both local development and production.
// Local dev uses localhost automatically; production build uses deployed backend.
// To force a backend in any environment, set NEXT_PUBLIC_API_URL before running Next.

const LOCAL_API_URL = 'http://localhost:5000';
// const PRODUCTION_API_URL = 'https://ebookbackend.vercel.app';
const PRODUCTION_API_URL = 'https://ebookbackend-chi.vercel.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_URL : PRODUCTION_API_URL);

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
        hostname: 'ebookbackend-chi.vercel.app',
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
