import Link from 'next/link';
import { ProductMockup } from '@/components/ProductMockup';
import {
  CheckList,
  Container,
  CtaBand,
  FaqSection,
  PageHero,
  RelatedLinks,
  SectionHeading,
} from '@/components/ui';
import { AUTOFILL_FAQS, GENERAL_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Job Application Autofill for Chrome',
  description:
    'Autofill job applications in one click: JobFill matches your saved profile to form fields on Google Forms, ATS pages and custom forms, and flags what needs review.',
  path: '/features/autofill',
  keywords: ['job application autofill', 'autofill job applications', 'resume autofill'],
});

const CRUMBS = [
  { name: 'Features', path: '/features' },
  { name: 'Autofill', path: '/features/autofill' },
];

const FILLS = [
  ['Personal details', 'Name, preferred name, email, phone, address, city and country'],
  ['Work experience', 'Job titles, companies, dates, current role and descriptions'],
  ['Education', 'Institution, degree, field of study and dates'],
  ['Skills and languages', 'Technical skills, soft skills and the languages you speak'],
  ['Links', 'LinkedIn, GitHub, portfolio and personal website'],
  ['Your resume file', 'Attached to standard resume upload fields'],
];

export default function AutofillPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Job application autofill"
        title="Fill job applications in one click — and check every field"
        lead="JobFill reads each form the way you do — labels, hints and surrounding text — and fills what matches your profile. Anything it isn’t sure about is left for you, clearly flagged."
      />

      <section aria-labelledby="fills-title" className="py-16 sm:py-20">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading id="fills-title" title="What JobFill fills" />
            <dl className="mt-8 space-y-5">
              {FILLS.map(([term, detail]) => (
                <div key={term}>
                  <dt className="font-semibold text-fg">{term}</dt>
                  <dd className="text-muted">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="pb-10">
            <ProductMockup />
          </div>
        </Container>
      </section>

      <section aria-labelledby="matching-title" className="bg-subtle py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            id="matching-title"
            title="How it recognises fields"
            lead="Every form phrases things differently: “Given name”, “First name”, “Legal first name”. JobFill combines several signals to work out what each field is asking for."
          />
          <ol className="space-y-5 text-body">
            {[
              [
                'Read the field',
                'Its visible label, name, autocomplete hints, placeholder, options and nearby text — even when the label isn’t linked to the input.',
              ],
              [
                'Understand the context',
                'Which section it sits in (“Education”, “Emergency contact”) so the same words mean the right thing.',
              ],
              [
                'Match to your profile',
                'A deterministic dictionary of how application forms ask for things, scored by confidence. No AI involved.',
              ],
              [
                'Decide safely',
                'Confident matches are filled; uncertain ones are marked for review; sensitive and consent questions are skipped.',
              ],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <strong className="block text-fg">{title}</strong>
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="where-title" className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            id="where-title"
            title="Works on the forms job seekers meet"
            lead="From a one-page Google Form to a multi-step applicant tracking system. Tested on sample pages built like these platforms — live sites change, so some fields may need manual entry."
          />
          <CheckList
            className="text-body"
            items={[
              <>
                <strong className="text-fg">Google Forms</strong> — text answers, multiple choice,
                checkboxes and dropdowns.{' '}
                <Link
                  href="/blog/how-to-autofill-google-forms"
                  className="text-accent hover:underline"
                >
                  Guide
                </Link>
              </>,
              <>
                <strong className="text-fg">Greenhouse- and Lever-style</strong> application pages,
                including custom dropdowns.
              </>,
              <>
                <strong className="text-fg">Workday-style multi-step forms</strong> — run autofill
                on each step.
              </>,
              <>
                <strong className="text-fg">Forms in iframes</strong>, such as job boards embedded
                in company careers pages.
              </>,
              <>
                <strong className="text-fg">Modern JavaScript forms</strong> built with React and
                similar frameworks, which ignore naive autofill.
              </>,
              <>
                <strong className="text-fg">Fields that appear later</strong>, like a details box
                revealed by an earlier answer.
              </>,
            ]}
          />
        </Container>
      </section>

      <section aria-labelledby="control-title" className="bg-ink py-16 text-white sm:py-20">
        <Container className="max-w-3xl text-center">
          <h2 id="control-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Fast, but never on autopilot
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            After every fill, JobFill shows what it filled and what needs your review. It never
            overwrites what you typed, never answers sensitive questions, and never submits the
            application. Prefer to approve field by field? Turn on{' '}
            <em>Preview fields before filling</em>.
          </p>
        </Container>
      </section>

      <FaqSection faqs={[...Object.values(AUTOFILL_FAQS), GENERAL_FAQS.sites]} />
      <RelatedLinks
        links={[
          {
            href: '/features/resume-parser',
            label: 'Resume parser',
            text: 'Build your profile from your resume in minutes.',
          },
          {
            href: '/blog/how-to-autofill-job-applications',
            label: 'How to autofill job applications',
            text: 'A step-by-step guide.',
          },
          {
            href: '/blog/how-to-use-chrome-autofill-for-job-applications',
            label: 'Chrome autofill vs. JobFill',
            text: 'Where built-in autofill stops.',
          },
        ]}
      />
      <CtaBand title="Try one-click job application autofill" />
    </>
  );
}
