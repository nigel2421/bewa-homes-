import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Native Firebase hosting or Vercel allows full SSR and dynamic routes natively without static export
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/units/:id/',
        destination: '/units/view/',
      },
      {
        source: '/stays/:id/',
        destination: '/units/view/',
      },
    ];
  },
  // COOP header lives in firebase.json headers for production;
  // keep it here for local dev
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
