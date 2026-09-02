import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Povolení přístupu přes síťovou IP (pro testování na mobilu apod.)
  allowedDevOrigins: ['172.20.10.2', '192.168.1.117', '172.20.10.6'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Povolí načítání obrázků z jakékoliv domény (vhodné pro testování)
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/eshop',
        destination: 'https://klub.pkznojmo.cz/public-store/1',
        permanent: false,
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