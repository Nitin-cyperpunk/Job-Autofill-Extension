import type { Metadata } from 'next';
import { SITE, absoluteUrl } from './site';

export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'JobFill — autofill job applications while keeping your profile on your device',
};

interface PageMeta {
  /** Unique, descriptive; the layout appends " | JobFill" unless `absoluteTitle`. */
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}

/** Title, description, canonical, Open Graph and X/Twitter metadata for one page. */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords,
}: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  const url = absoluteUrl(path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
      ...(type === 'article' ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
