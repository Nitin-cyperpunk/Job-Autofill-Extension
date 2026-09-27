/**
 * Blog post metadata. Each post's body lives in ./posts/<slug>.tsx and is registered
 * in ./registry.tsx. Titles are unique; descriptions stay under ~160 characters.
 */
export interface PostMeta {
  slug: string;
  /** On-page H1. */
  title: string;
  /** <title> (layout appends " | JobFill"). */
  metaTitle: string;
  description: string;
  /** For footers and cards. */
  shortTitle: string;
  published: string;
  updated: string;
  readingMinutes: number;
  keywords: string[];
}

export const POSTS: PostMeta[] = [
  {
    slug: 'how-to-autofill-job-applications',
    title: 'How to autofill job applications: a step-by-step guide',
    metaTitle: 'How to Autofill Job Applications (Step-by-Step Guide)',
    description:
      'Learn how to autofill job applications in Chrome: set up a reusable profile, fill forms in one click, and review every field before you submit.',
    shortTitle: 'How to autofill job applications',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 7,
    keywords: ['job application autofill', 'autofill job applications', 'autofill resume'],
  },
  {
    slug: 'how-to-autofill-google-forms',
    title: 'How to autofill Google Forms job applications',
    metaTitle: 'How to Autofill Google Forms Job Applications',
    description:
      'Many employers collect applications with Google Forms. Here’s how to autofill text fields, choices and dropdowns in Google Forms — and what still needs you.',
    shortTitle: 'How to autofill Google Forms',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 6,
    keywords: ['Google Forms autofill', 'autofill Google Forms', 'job application autofill'],
  },
  {
    slug: 'how-to-use-chrome-autofill-for-job-applications',
    title: 'How to use Chrome autofill for job applications (and where it falls short)',
    metaTitle: 'How to Use Chrome Autofill for Job Applications',
    description:
      'Set up Chrome’s built-in autofill for your name, email, phone and address, learn why it stops there on job applications, and how to fill the rest.',
    shortTitle: 'Chrome autofill for job applications',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 6,
    keywords: ['Chrome autofill', 'Chrome extension for job applications', 'autofill resume'],
  },
  {
    slug: 'how-to-fill-job-applications-faster',
    title: 'How to fill out job applications faster without cutting corners',
    metaTitle: 'How to Fill Out Job Applications Faster: 9 Practical Ways',
    description:
      'Practical ways to fill out job applications faster: a master profile, reusable answers, autofill, batching and a simple review routine that keeps quality high.',
    shortTitle: 'Fill job applications faster',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 7,
    keywords: [
      'job application automation',
      'job search productivity tools',
      'job application assistant',
    ],
  },
  {
    slug: 'best-job-application-tools',
    title: 'The best job application tools for an organised job search',
    metaTitle: 'Best Job Application Tools for Your Job Search',
    description:
      'The kinds of job application tools worth using — autofill extensions, resume editors, trackers and more — and how to choose ones that respect your privacy.',
    shortTitle: 'Best job application tools',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 8,
    keywords: [
      'job search productivity tools',
      'job application assistant',
      'AI job application assistant',
    ],
  },
  {
    slug: 'job-application-tips',
    title: 'Job application tips that make every application stronger',
    metaTitle: 'Job Application Tips: 12 Ways to Stand Out',
    description:
      'Practical job application tips: read the posting properly, tailor your answers, check your details, handle screening questions and follow up well.',
    shortTitle: 'Job application tips',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 8,
    keywords: ['job application tips', 'job application assistant'],
  },
  {
    slug: 'job-application-tracking',
    title: 'Job application tracking: a simple system that works',
    metaTitle: 'Job Application Tracking: A Simple System (Free Template)',
    description:
      'How to track job applications with a simple spreadsheet: the columns worth keeping, statuses, follow-up dates, and saving postings before they disappear.',
    shortTitle: 'Job application tracking',
    published: '2026-09-27',
    updated: '2026-09-27',
    readingMinutes: 6,
    keywords: ['job application tracking', 'job search productivity tools'],
  },
];

export function getPost(slug: string): PostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}
