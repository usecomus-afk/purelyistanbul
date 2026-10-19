import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/marketplace/legal/gizlilik-bildirimi',
        destination: '/marketplace/legal/privacy-policy',
        permanent: true,
      },
      {
        source: '/marketplace/legal/hizmet-kosullari',
        destination: '/marketplace/legal/terms-of-service',
        permanent: true,
      },
      {
        source: '/marketplace/iletisim',
        destination: '/marketplace/contact',
        permanent: true,
      },
      {
        source: '/marketplace/legal/calisma-seklimiz',
        destination: '/marketplace/legal/how-we-work',
        permanent: true,
      },
      {
        source: '/marketplace/legal/erisilebilirlik-bildirisi',
        destination: '/marketplace/legal/accessibility',
        permanent: true,
      },
      {
        source: '/marketplace/partner/kayit',
        destination: '/marketplace/partner/register',
        permanent: true,
      },
      {
        source: '/marketplace/partner/istirak',
        destination: '/marketplace/partner/partnership',
        permanent: true,
      },
      {
        source: '/marketplace/partner/yardim',
        destination: '/marketplace/partner/support',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
