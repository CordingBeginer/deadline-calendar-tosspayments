/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
  },
};

module.exports = nextConfig;
