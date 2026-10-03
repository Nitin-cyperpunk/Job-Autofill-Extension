import Link from 'next/link';
import { ProductMockup } from '@/components/ProductMockup';
import { Container, CtaBand, FaqSection, PageHero, RelatedLinks } from '@/components/ui';
import { AUTOFILL_FAQS, GENERAL_FAQS, RESUME_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'How JobFill Works: Autofill Job Applications in 5 Steps',
  description:
    'See how JobFill works: install the Chrome extension, import your resume, open an application, autofill it in one click, then review and submit it yourself.',
  path: '/how-it-works',
});

const CRUMBS = [{ name: 'How it works', path: '/how-it-works' }];

const STEPS = [
  {
    title: 'Add JobFill to Chrome',
    text: (
      <>
        Install the extension and pin it to your toolbar. There’s no account to create. The{' '}
        <Link href="/install" className="text-accent hover:underline">
          install guide
        </Link>{' '}
        walks through it.
      </>
    ),
  },
  {
    title: 'Create your profile',
    text: (
      <>
        Import your resume — JobFill’s{' '}
        <Link href="/features/resume-parser" className="text-accent hover:underline">
          resume parser
        </Link>{' '}
        reads it on your device and you approve each detail — or fill in the sections yourself. A
        completeness indicator shows what’s missing.
      </>
    ),
  },
  {
    title: 'Open a job application',
    text: 'Open an application form in Chrome — a company careers page, an applicant tracking system, or a Google Form. JobFill notices the form’s fields as the page loads, without changing anything.',
  },
  {
    title: 'Click “Autofill Application”',
    text: (
      <>
        JobFill fills the fields that match your profile and shows a summary: how many fields it
        filled and which ones need review. Prefer to approve each value first? Turn on{' '}
        <em>Preview fields before filling</em>. Learn more about{' '}
        <Link href="/features/autofill" className="text-accent hover:underline">
          how autofill recognises fields
        </Link>
        .
      </>
    ),
  },
  {
    title: 'Answer, review and submit',
    text: (
      <>
        Answer the open questions yourself — or draft them with{' '}
        <Link href="/features/ai-answers" className="text-accent hover:underline">
          optional AI answers
        </Link>{' '}
        — check the form, and submit it. JobFill never submits for you.
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="How it works"
        title="How JobFill autofills job applications"
        lead="Five steps: set up once, then fill applications in seconds — with you reviewing each one before it’s sent."
      />

      <section aria-labelledby="steps-title" className="py-16 sm:py-20">
        <Container className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 id="steps-title" className="sr-only">
              The five steps
            </h2>
            <ol className="relative space-y-10 border-l-2 border-accent-line pl-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="absolute -left-[3.05rem] flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white ring-4 ring-canvas">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-semibold text-fg">{step.title}</h3>
                  <p className="mt-2 leading-7 text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductMockup />
          </div>
        </Container>
      </section>

      <section aria-labelledby="review-title" className="bg-subtle py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 id="review-title" className="text-3xl font-bold tracking-tight text-fg">
            What “needs review” means
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            After each fill, JobFill lists the fields it left for you. They usually fall into four
            groups:
          </p>
          <ul className="mt-6 space-y-3 text-body">
            <li>
              <strong className="text-fg">Open questions</strong> — “Why do you want to work here?”
              needs your answer.
            </li>
            <li>
              <strong className="text-fg">Uncertain matches</strong> — when a field could mean more
              than one thing, JobFill asks rather than guesses.
            </li>
            <li>
              <strong className="text-fg">Missing profile data</strong> — the form asks for
              something your profile doesn’t have yet.
            </li>
            <li>
              <strong className="text-fg">Personal &amp; consent questions</strong> — demographic,
              identity or legal questions you haven’t answered in your profile, and every consent
              box, are yours to answer.
            </li>
          </ul>
        </Container>
      </section>

      <FaqSection
        faqs={[
          GENERAL_FAQS.submit,
          AUTOFILL_FAQS.preview,
          AUTOFILL_FAQS.multistep,
          AUTOFILL_FAQS.existing,
          RESUME_FAQS.overwrite,
        ]}
      />
      <RelatedLinks
        links={[
          {
            href: '/install',
            label: 'Install JobFill',
            text: 'Get set up in a couple of minutes.',
          },
          {
            href: '/features',
            label: 'All features',
            text: 'Autofill, resume parser, AI answers and more.',
          },
          {
            href: '/blog/how-to-autofill-job-applications',
            label: 'Autofill guide',
            text: 'Tips for accurate autofill.',
          },
        ]}
      />
      <CtaBand />
    </>
  );
}
