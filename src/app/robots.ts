import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/hotel-portal/', '/api/', '/usepurelydashboard', '/usepurelydashboard/', '/pilot/', '/admin/'],
    },
    sitemap: 'https://www.purelyistanbul.com/sitemap.xml',
  };
}
