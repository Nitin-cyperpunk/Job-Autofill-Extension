/** Every indexable non-blog page. Add new routes here; scripts/check-seo.mjs fails the build check if a page is missing. */
export const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: 'weekly' | 'monthly';
}> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/chrome-extension', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/features', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/features/autofill', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/features/resume-parser', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/features/ai-answers', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/how-it-works', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/install', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
];
