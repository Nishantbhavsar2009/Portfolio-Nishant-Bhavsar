/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14 bundles ESLint 8 internally; ESLint 9 flat config
  // is not yet supported by `next lint`. Linting is done separately
  // via `npx eslint .` with the legacy .eslintrc.json config.
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  // Allow GSAP + Lenis to work with SSR
  transpilePackages: ['@studio-freight/lenis'],
};

module.exports = nextConfig;
