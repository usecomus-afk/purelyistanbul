import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'purelyİstanbul - Digital Guest Directory',
    short_name: 'purelyİstanbul',
    description: 'purelyİstanbul In-Room Hotel Services & Curated Experiences Concierge',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f6f0',
    theme_color: '#c9a227',
    icons: [
      {
        src: '/icons/app/icon-192.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any'
      },
      {
        src: '/icons/app/icon-512.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any'
      }
    ]
  };
}
