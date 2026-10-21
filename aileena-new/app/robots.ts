import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cabinet', '/inbox', '/council', '/reviews', '/proof'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
