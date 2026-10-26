import type { NextConfig } from 'next';

const securityHeaders = [
  // HTTPS'i zorla (2 yıl, alt alan adları dahil).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Clickjacking: yalnızca aynı kökenden iframe.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Kamera (online check-in OCR), konum ve bildirimler yalnızca kendi kökenimiz için.
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=(), payment=(self), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // CSP önce Report-Only: sayfaları bozmadan ihlalleri tarayıcı konsolunda görmek için.
  // İhlal kalmadığında anahtarı 'Content-Security-Policy' olarak değiştirin.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://apis.google.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.google-analytics.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com",
      "frame-src 'self' https://*.firebaseapp.com https://www.google.com https://maps.google.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Sunucu teknolojisini ifşa eden X-Powered-By başlığını kaldır.
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Service worker her zaman güncel gelmeli ve kendi kapsamıyla sınırlı kalmalı.
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
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
