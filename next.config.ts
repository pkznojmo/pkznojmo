import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Doporučeno zúžit z '**' na vaši databázi
      },
    ],
  },

  // Změna z rewrites na redirects (klasické HTTP přesměrování)
  async redirects() {
    return [
      {
        source: '/eshop',
        destination: 'https://klub.pkznojmo.cz/public-store/1',
        permanent: false, // HTTP 307 (dočasné přesměrování)
      },
      {
        source: '/prihlaska',
        destination: 'https://klub.pkznojmo.cz/registration/',
        permanent: false,
      },
      {
        source: '/tabory',
        destination: 'https://klub.pkznojmo.cz/public-signups',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;