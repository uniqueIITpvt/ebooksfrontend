/**
 * Unit tests: next.config.ts
 *
 * Use case: The slow-filesystem warning from Next.js dev server led to an
 * attempted distDir override that broke the dev server on Windows
 * (cross-drive path appended as relative). The fix was reverted, leaving
 * next.config.ts clean. These tests verify the config structure is correct
 * and guard against regressions in the API URL selection logic, image
 * settings, and CORS headers.
 */

// ── Config structure ──────────────────────────────────────────────────────────

describe('next.config.ts — structure', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require('../../../next.config').default;

  test('distDir is not overridden (no cross-drive path breakage)', () => {
    expect(config.distDir).toBeUndefined();
  });

  test('transpilePackages includes swiper', () => {
    expect(config.transpilePackages).toContain('swiper');
  });

  test('images.unoptimized is true', () => {
    expect(config.images.unoptimized).toBe(true);
  });

  test('images.qualities array is defined', () => {
    expect(Array.isArray(config.images.qualities)).toBe(true);
    expect(config.images.qualities.length).toBeGreaterThan(0);
  });
});

// ── Image remote patterns ─────────────────────────────────────────────────────

describe('next.config.ts — image remotePatterns', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { remotePatterns } = require('../../../next.config').default.images;

  const hostnames = (remotePatterns as { hostname: string }[]).map(p => p.hostname);

  test('allows Cloudinary images', () => {
    expect(hostnames).toContain('res.cloudinary.com');
  });

  test('allows localhost for local development', () => {
    expect(hostnames).toContain('localhost');
  });

  test('allows Clearbit logo API', () => {
    expect(hostnames).toContain('logo.clearbit.com');
  });

  test('all patterns have a protocol defined', () => {
    (remotePatterns as { protocol?: string }[]).forEach(p => {
      expect(p.protocol).toBeDefined();
    });
  });
});

// ── API URL selection logic ───────────────────────────────────────────────────

describe('next.config.ts — API URL selection', () => {
  const LOCAL_API_URL = 'http://localhost:5000';
  const PRODUCTION_API_URL = 'https://ebookbackend-chi.vercel.app';

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
    jest.resetModules();
  });

  test('uses localhost in development when no env override is set', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    let cfg: { env: { NEXT_PUBLIC_API_URL: string } } | undefined;
    jest.isolateModules(() => {
      (process.env as NodeJS.ProcessEnv & { NODE_ENV: string }).NODE_ENV = 'development';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cfg = require('../../../next.config').default;
    });
    expect(cfg!.env.NEXT_PUBLIC_API_URL).toBe(LOCAL_API_URL);
  });

  test('uses production URL when NODE_ENV is production', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    let cfg: { env: { NEXT_PUBLIC_API_URL: string } } | undefined;
    jest.isolateModules(() => {
      (process.env as NodeJS.ProcessEnv & { NODE_ENV: string }).NODE_ENV = 'production';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cfg = require('../../../next.config').default;
    });
    expect(cfg!.env.NEXT_PUBLIC_API_URL).toBe(PRODUCTION_API_URL);
  });

  test('NEXT_PUBLIC_API_URL env var takes priority over NODE_ENV', () => {
    const customUrl = 'https://my-custom-api.example.com';
    process.env.NEXT_PUBLIC_API_URL = customUrl;
    let cfg: { env: { NEXT_PUBLIC_API_URL: string } } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cfg = require('../../../next.config').default;
    });
    expect(cfg!.env.NEXT_PUBLIC_API_URL).toBe(customUrl);
  });
});

// ── CORS headers ──────────────────────────────────────────────────────────────

describe('next.config.ts — CORS headers', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require('../../../next.config').default;

  test('headers() function is defined', () => {
    expect(typeof config.headers).toBe('function');
  });

  test('headers() returns an array', async () => {
    const result = await config.headers();
    expect(Array.isArray(result)).toBe(true);
  });

  test('applies headers to all routes via /:path*', async () => {
    const result: { source: string }[] = await config.headers();
    const sources = result.map(r => r.source);
    expect(sources).toContain('/:path*');
  });

  test('sets Access-Control-Allow-Origin: *', async () => {
    const result: { headers: { key: string; value: string }[] }[] = await config.headers();
    const allHeaders = result.flatMap(r => r.headers);
    const corsHeader = allHeaders.find(h => h.key === 'Access-Control-Allow-Origin');
    expect(corsHeader).toBeDefined();
    expect(corsHeader!.value).toBe('*');
  });
});
