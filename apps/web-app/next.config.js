const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Cache strategies
  runtimeCaching: [
    // Cache Next.js static assets
    {
      urlPattern: /^https?.*\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Cache API responses (dashboard, devices, alerts) — stale-while-revalidate
    {
      urlPattern: /^https?.*\/api\/v1\/(dashboard|devices|alerts|goals|badges).*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 4 }, // 4 hours
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Cache page navigations
    {
      urlPattern: /^https?.*\/parent\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 5,
      },
    },
    // Cache Google Fonts if used
    {
      urlPattern: /^https?:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    "@kavach/shared-types",
    "@kavach/shared-constants",
    "@kavach/shared-utils",
  ],
  // Required for standalone output in Docker if used
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
}

module.exports = withPWA(nextConfig)
