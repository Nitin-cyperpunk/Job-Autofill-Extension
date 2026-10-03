import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Motion } from '@/components/Motion';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { JsonLd } from '@/components/ui';
import { graph, organizationSchema, websiteSchema } from '@/lib/schema';
import { OG_IMAGE } from '@/lib/seo';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import { GOOGLE_SITE_VERIFICATION, SITE, SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — Job Application Autofill for Chrome`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: { siteName: SITE.name, locale: SITE.locale, type: 'website', images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  // Google Search Console HTML-tag verification — only when the owner sets the token.
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0d12' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script may set data-theme before React loads.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={graph(organizationSchema(), websiteSchema())} />
        {/* Vercel Web Analytics: cookieless page-view counts (see /privacy → About this website). */}
        <Analytics />
        <Motion />
      </body>
    </html>
  );
}
