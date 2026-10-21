import type { MetadataRoute } from 'next';
import { SITE_URL, STATIC_PATHS, blogPosts, isoDate } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({ url: `${SITE_URL}${p === '/' ? '' : p}` }));
  const posts: MetadataRoute.Sitemap = blogPosts().map((p) => ({
    url: `${SITE_URL}${p.href}`,
    lastModified: isoDate(p.date),
  }));
  return [...pages, ...posts];
}
