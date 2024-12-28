/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    config.resolve = {
      ...config.resolve,
      preferRelative: true
    };
    return config;
  },
}

module.exports = nextConfig
