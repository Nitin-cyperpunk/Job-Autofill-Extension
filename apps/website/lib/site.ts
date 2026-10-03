/**
 * Site-wide facts. Everything the marketing site says about the product should be
 * true of the extension in this repo — no invented numbers, users or reviews.
 */

/**
 * Production origin, no trailing slash. Set NEXT_PUBLIC_APP_URL when deploying
 * (NEXT_PUBLIC_SITE_URL is accepted too).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://job-autofill-extension-nyqt.vercel.app'
).replace(/\/+$/, '');

/**
 * The Chrome Web Store listing. Until it's set, "Add to Chrome" buttons lead to the
 * install guide instead of a broken or guessed store link.
 */
export const CHROME_WEB_STORE_URL = process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL ?? '';

export const SITE = {
  name: 'JobFill',
  tagline: 'Autofill job applications faster while keeping your profile on your device.',
  slogan: 'Less typing. More applying.',
  description:
    'JobFill is a Chrome extension that autofills job applications from a profile stored on your own device. Import your resume, review every field, and submit when you’re ready.',
  locale: 'en_US',
  lastUpdated: '2026-09-27',
} as const;

/** An optional https URL from the environment; anything else counts as "not configured". */
function optionalUrl(value: string | undefined): string {
  const url = value?.trim() ?? '';
  return /^https:\/\/[^\s]+$/.test(url) ? url : '';
}

/** A contact address from the environment, or empty (then contact lines are hidden). */
function optionalEmail(value: string | undefined): string {
  const email = value?.trim() ?? '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

/** Where users write for help. Set NEXT_PUBLIC_SUPPORT_EMAIL; nothing is shown until then. */
export const SUPPORT_EMAIL = optionalEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);

/**
 * Community, support and creator links. Nothing here is guessed: each is either a URL the
 * creator provided or empty until its environment variable is set, and the UI hides or marks
 * as "coming soon" whatever is empty.
 * (Referenced as literal process.env.NEXT_PUBLIC_* so Next inlines them at build time.)
 */
export const LINKS = {
  /** Buy Me a Coffee page (the creator's). NEXT_PUBLIC_SUPPORT_URL is accepted too. */
  support: optionalUrl(
    process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL ||
      process.env.NEXT_PUBLIC_SUPPORT_URL ||
      'https://buymeacoffee.com/nitinverse',
  ),
  /** The project's public repository (the creator's). */
  github: optionalUrl(
    process.env.NEXT_PUBLIC_GITHUB_URL ||
      'https://github.com/Nitin-cyperpunk/Job-Autofill-Extension',
  ),
  x: optionalUrl(process.env.NEXT_PUBLIC_X_URL),
  docs: optionalUrl(process.env.NEXT_PUBLIC_DOCS_URL),
  terms: optionalUrl(process.env.NEXT_PUBLIC_TERMS_URL),
  /** The creator's site or profile, linked from "Crafted by Nitinverse". */
  creator: optionalUrl(process.env.NEXT_PUBLIC_CREATOR_URL),
} as const;

export const CREATOR = { name: 'Nitinverse' } as const;

/** Google Search Console HTML-tag token (content value only). Empty = no meta tag. */
export const GOOGLE_SITE_VERIFICATION = (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '')
  .trim()
  .replace(/[^A-Za-z0-9_-]/g, '');

/** "Report an issue" link: the repository's Issues page when LINKS.github is a GitHub repo. */
export const ISSUES_URL = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(LINKS.github)
  ? `${LINKS.github.replace(/\/$/, '')}/issues`
  : '';

export const ADD_TO_CHROME_HREF = CHROME_WEB_STORE_URL || '/install';
export const TRY_HREF = '/install#get-started';

export function absoluteUrl(path = '/'): string {
  // The homepage is written with its trailing slash: https://…vercel.app/
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const NAV = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/blog', label: 'Blog' },
  { href: '/support', label: 'Support' },
] as const;

/** localStorage key for the website's theme preference ('light' | 'dark'; absent = system). */
export const THEME_STORAGE_KEY = 'jobfill-theme';
