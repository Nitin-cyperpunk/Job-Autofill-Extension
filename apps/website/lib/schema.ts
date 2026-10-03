import { CHROME_WEB_STORE_URL, SITE, SITE_URL, absoluteUrl } from './site';

/**
 * schema.org JSON-LD builders. Only facts we can stand behind: no ratings, review
 * counts or download numbers.
 */

type Json = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;

export function organizationSchema(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: SITE_URL,
    logo: absoluteUrl('/logo-128.png'),
  };
}

export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  };
}

/**
 * The extension as a SoftwareApplication. Facts only: no ratings, review counts,
 * download numbers or prices (there is no paid plan to describe).
 */
export function softwareApplicationSchema(): Json {
  return {
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: SITE.name,
    description: SITE.description,
    url: SITE_URL,
    applicationCategory: 'BrowserApplication',
    applicationSubCategory: 'Job application autofill',
    operatingSystem: 'Google Chrome (desktop)',
    browserRequirements:
      'Requires Google Chrome on desktop; other Chromium-based browsers may work',
    ...(CHROME_WEB_STORE_URL ? { installUrl: CHROME_WEB_STORE_URL } : {}),
    isAccessibleForFree: true,
    featureList: [
      'Autofill job application forms from a locally stored profile',
      'Structured current and permanent addresses, education, experience and projects',
      'Resume parsing on your device (PDF, DOCX, TXT)',
      'Preview fields before filling; never overwrites what you typed',
      'Optional AI-drafted answers with your own API key and per-question consent',
      'Export, import and delete your data at any time',
    ],
    publisher: { '@id': ORG_ID },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export interface Faq {
  q: string;
  /** Plain text: used both on the page and in the schema. */
  a: string;
}

export function faqSchema(faqs: Faq[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function blogPostingSchema(post: {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated: string;
}): Json {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: url,
    datePublished: post.published,
    dateModified: post.updated,
    image: absoluteUrl('/og-image.png'),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  };
}

export function blogSchema(posts: Array<{ slug: string; title: string; published: string }>): Json {
  return {
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    name: `${SITE.name} blog`,
    url: absoluteUrl('/blog'),
    publisher: { '@id': ORG_ID },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: absoluteUrl(`/blog/${p.slug}`),
      datePublished: p.published,
    })),
  };
}

/** Wrap one or more nodes in a single @graph document. */
export function graph(...nodes: Json[]): Json {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
