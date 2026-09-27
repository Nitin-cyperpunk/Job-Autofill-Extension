import type { MetadataRoute } from 'next';
import { POSTS } from '@/content/blog';
import { STATIC_ROUTES } from '@/lib/routes';
import { SITE, absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: absoluteUrl(r.path),
      lastModified: SITE.lastUpdated,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...POSTS.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
