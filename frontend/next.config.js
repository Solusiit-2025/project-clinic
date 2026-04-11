/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
  },
  experimental: {
    turbopack: {
      root: '.',
    },
  },
}

module.exports = nextConfig
