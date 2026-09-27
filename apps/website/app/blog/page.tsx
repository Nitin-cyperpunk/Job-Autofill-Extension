import Link from 'next/link';
import { Container, CtaBand, JsonLd, PageHero } from '@/components/ui';
import { POSTS } from '@/content/blog';
import { blogSchema, graph } from '@/lib/schema';
import { formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Blog: Job Application Guides and Productivity Tips',
  description:
    'Practical guides to autofilling job applications, filling forms faster, Google Forms applications, tracking your applications and choosing job search tools.',
  path: '/blog',
});

const CRUMBS = [{ name: 'Blog', path: '/blog' }];

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd data={graph(blogSchema(POSTS))} />
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Blog"
        title="Guides for a faster, calmer job search"
        lead="How to fill job applications faster, get the most from autofill, and stay organised — without handing your personal data to more services than you need."
        cta={false}
      />
      <section aria-label="Articles" className="py-16 sm:py-20">
        <Container>
          <ul className="grid gap-6 md:grid-cols-2">
            {POSTS.map((post) => (
              <li key={post.slug}>
                <article className="relative flex h-full flex-col rounded-xl border border-line p-7 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
                  <p className="text-sm text-muted">
                    <time dateTime={post.published}>{formatDate(post.published)}</time> ·{' '}
                    {post.readingMinutes} min read
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-fg">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-muted">{post.description}</p>
                  <span className="mt-5 text-sm font-semibold text-accent">Read article →</span>
                </article>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
