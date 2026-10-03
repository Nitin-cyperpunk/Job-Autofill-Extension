import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Container, CtaBand, CtaButtons, JsonLd } from '@/components/ui';
import { POSTS, getPost } from '@/content/blog';
import { POST_BODIES } from '@/content/blog/registry';
import { formatDate } from '@/lib/format';
import { blogPostingSchema, graph } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: post.metaTitle,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.published,
    modifiedTime: post.updated,
    keywords: post.keywords,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  const Body = POST_BODIES[slug];
  if (!post || !Body) notFound();

  const related = POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <JsonLd data={graph(blogPostingSchema(post))} />
      <article>
        <header className="border-b border-line bg-subtle">
          <Container className="max-w-3xl py-12 sm:py-16">
            <Breadcrumbs
              crumbs={[
                { name: 'Blog', path: '/blog' },
                { name: post.shortTitle, path: `/blog/${post.slug}` },
              ]}
            />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-fg sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted">{post.description}</p>
            <p className="mt-6 text-sm text-muted">
              By the JobFill team ·{' '}
              <time dateTime={post.published}>{formatDate(post.published)}</time>
              {post.updated !== post.published && (
                <>
                  {' '}
                  · Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </>
              )}{' '}
              · {post.readingMinutes} min read
            </p>
          </Container>
        </header>
        <Container className="max-w-3xl py-12 sm:py-14">
          <div className="prose">
            <Body />
          </div>
          <div className="mt-14 rounded-xl border border-line p-6">
            <p className="font-semibold text-fg">Autofill your next application with JobFill</p>
            <p className="mt-1 text-muted">
              A Chrome extension that fills job applications from a profile kept on your device.
            </p>
            <CtaButtons className="mt-5" />
          </div>
        </Container>
      </article>

      <section aria-labelledby="more-title" className="border-t border-line bg-subtle py-14">
        <Container>
          <h2 id="more-title" className="text-2xl font-bold tracking-tight text-fg">
            More guides
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block h-full rounded-xl border border-line bg-surface p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-accent-line hover:shadow-raised"
                >
                  <span className="font-semibold text-fg">{p.title}</span>
                  <span className="mt-1 block text-sm text-muted">{p.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
