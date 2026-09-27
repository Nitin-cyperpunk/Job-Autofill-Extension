import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — Job Application Autofill`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#1f5ad6',
    icons: [{ src: '/logo-128.png', sizes: '128x128', type: 'image/png' }],
  };
}
