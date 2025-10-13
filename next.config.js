/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

