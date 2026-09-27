import Link from 'next/link';
import { Container, CtaBand, FaqList, JsonLd, PageHero } from '@/components/ui';
import { FAQ_GROUPS } from '@/content/faqs';
import { faqSchema, graph } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'FAQ: Job Application Autofill, Privacy, Resume Import and AI',
  description:
    'Answers about JobFill: how job application autofill works, where your profile is stored, which forms it supports, resume import and optional AI answers.',
  path: '/faq',
});

const CRUMBS = [{ name: 'FAQ', path: '/faq' }];

export default function FaqPage() {
  const all = FAQ_GROUPS.flatMap((g) => g.faqs);
  return (
    <>
      <JsonLd data={graph(faqSchema(all))} />
      <PageHero
        crumbs={CRUMBS}
        eyebrow="FAQ"
        title="Frequently asked questions"
        lead="Everything about how JobFill fills job applications, where your data lives, and what you stay in control of."
      />
      <Container className="grid max-w-5xl gap-12 py-16 sm:py-20 lg:grid-cols-[12rem_1fr]">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {FAQ_GROUPS.map((g) => (
              <li key={g.id}>
                <Link
                  href={`#${g.id}`}
                  className="block rounded-lg px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-line hover:text-accent lg:ring-0"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-14">
          {FAQ_GROUPS.map((g) => (
            <section
              key={g.id}
              id={g.id}
              aria-labelledby={`${g.id}-title`}
              className="scroll-mt-24"
            >
              <h2 id={`${g.id}-title`} className="text-2xl font-bold tracking-tight text-fg">
                {g.title}
              </h2>
              <FaqList faqs={g.faqs} className="mt-6" />
            </section>
          ))}
        </div>
      </Container>
      <Container className="max-w-5xl pb-4">
        <p className="rounded-xl border border-line bg-subtle px-5 py-4 text-sm text-body">
          <strong className="text-fg">Still stuck?</strong>{' '}
          {SUPPORT_EMAIL ? (
            <>
              Email{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-accent hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              with the page’s address and what didn’t work.
            </>
          ) : (
            <>
              See the{' '}
              <Link href="/support#get-help" className="font-medium text-accent hover:underline">
                Support page
              </Link>{' '}
              for ways to get help.
            </>
          )}
        </p>
      </Container>
      <CtaBand />
    </>
  );
}
