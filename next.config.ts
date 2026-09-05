import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Změna z redirects na rewrites (Server Proxy - obchází CORS)
  async rewrites() {
    return [
      {
        source: '/eshop',
        destination: 'https://klub.pkznojmo.cz/public-store/1',
      },
      {
        source: '/prihlaska',
        destination: 'https://klub.pkznojmo.cz/registration/',
      },
      {
        source: '/tabory',
        destination: 'https://klub.pkznojmo.cz/public-signups',
      },
    ];
  },
};

export default nextConfig;
