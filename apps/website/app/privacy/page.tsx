import Link from 'next/link';
import { Container, CtaBand, FaqSection, PageHero } from '@/components/ui';
import { AI_FAQS, PRIVACY_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/format';
import { SITE, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'JobFill Privacy Policy',
  absoluteTitle: true,
  description:
    'How JobFill handles your data: what stays on your device, what may leave it and why, which provider receives it, and how to export or delete everything.',
  path: '/privacy',
});

const CRUMBS = [{ name: 'Privacy', path: '/privacy' }];

const STAYS = [
  [
    'Your profile',
    'Personal and professional details, education, experience, projects, certifications, skills and links.',
  ],
  ['Your resume file', 'Only if you choose to keep it, for attaching to applications.'],
  ['Settings', 'Preferences such as preview mode.'],
  ['AI settings', 'Only if you turn AI on: provider, model and your own API key.'],
];

const FLOWS = [
  {
    feature: 'Autofill',
    what: 'The profile values that match fields on the form you’re filling, and your resume file if the form has a resume upload field.',
    why: 'To fill in the application you asked JobFill to fill.',
    who: 'The website you’re on. Like anything typed into a form, the site can read filled fields straight away and receives them when you submit.',
    when: 'Only when you click “Autofill Application”. JobFill never submits the form.',
  },
  {
    feature: 'AI answers (optional, off by default)',
    what: 'The question; the job title, company and description from the page; and only the profile details you tick — such as relevant skills and experience highlights. Your API key is sent to authenticate. Never your name, contact details, address, links, salary, work authorization, demographic answers or resume file.',
    why: 'To draft an answer to that one question.',
    who: 'The AI provider you chose — OpenAI, Google Gemini or an OpenAI-compatible endpoint — directly from the extension in your browser. Its own privacy policy and retention apply, and like any website it sees your IP address.',
    when: 'Only when you click “Generate Answer”, after seeing exactly what will be sent.',
  },
  {
    feature: 'Export profile',
    what: 'Your profile, and your resume file if you include it, as a JSON file.',
    why: 'To back up your data or move it to another browser.',
    who: 'A file saved on your computer; where it goes next is up to you.',
    when: 'Only when you click “Export profile”.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Privacy"
        title="Your job application profile stays on your device"
        lead="JobFill is local-first. Your data doesn’t leave your device unless you use a feature that needs it — and this page explains exactly what, why, and to whom."
      >
        <p className="mt-6 text-sm text-muted">
          Last updated <time dateTime={SITE.lastUpdated}>{formatDate(SITE.lastUpdated)}</time>
        </p>
      </PageHero>

      <Container className="max-w-4xl py-16 sm:py-20">
        <div className="space-y-16">
          <section aria-labelledby="stays-title">
            <h2 id="stays-title" className="text-3xl font-bold tracking-tight text-fg">
              What stays on your device
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Everything JobFill keeps is stored in your browser’s extension storage on the device
              you’re using. It isn’t synced to your Google account, websites can’t read it, and
              there is no JobFill server or account to copy it to.
            </p>
            <dl className="mt-8 divide-y divide-line rounded-xl border border-line">
              {STAYS.map(([term, detail]) => (
                <div key={term} className="grid gap-1 p-5 sm:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold text-fg">{term}</dt>
                  <dd className="text-muted">{detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-muted">
              <strong className="text-fg">Not kept at all:</strong> AI prompts and generated answers
              (there’s no AI history), a history of the sites you visit or the applications you
              fill, and the contents of the pages you use JobFill on. Resumes are parsed on your
              device — the file isn’t uploaded to extract your details.
            </p>
          </section>

          <section aria-labelledby="leave-title">
            <h2 id="leave-title" className="text-3xl font-bold tracking-tight text-fg">
              What may leave your device
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              There are three ways data leaves JobFill, and each happens only when you click the
              button for it.
            </p>
            <div className="mt-8 space-y-6">
              {FLOWS.map((flow) => (
                <article key={flow.feature} className="rounded-xl border border-line p-6">
                  <h3 className="text-xl font-semibold text-fg">{flow.feature}</h3>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
                    <dt className="font-medium text-muted">What is sent</dt>
                    <dd className="text-body">{flow.what}</dd>
                    <dt className="font-medium text-muted">Why it is sent</dt>
                    <dd className="text-body">{flow.why}</dd>
                    <dt className="font-medium text-muted">Who receives it</dt>
                    <dd className="text-body">{flow.who}</dd>
                    <dt className="font-medium text-muted">When</dt>
                    <dd className="text-body">{flow.when}</dd>
                  </dl>
                </article>
              ))}
            </div>
            <p className="mt-6 text-muted">
              The extension contains no analytics, telemetry, advertising or crash reporting, and
              makes no network requests of its own apart from the optional AI requests above. Chrome
              itself may check for extension updates.
            </p>
          </section>

          <section aria-labelledby="controls-title">
            <h2 id="controls-title" className="text-3xl font-bold tracking-tight text-fg">
              Your controls
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              JobFill’s Privacy settings page shows all of this for your own setup — including which
              AI provider, if any, would receive a request — and lets you:
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Export profile', 'Download a copy of your data.'],
                [
                  'Import profile',
                  'Restore or move your profile, previewed before it replaces anything.',
                ],
                ['Forget your AI key', 'Turn AI off and remove your API key and settings.'],
                [
                  'Delete all local data',
                  'Erase your profile, resume, settings and API key from this device.',
                ],
              ].map(([title, text]) => (
                <li key={title} className="rounded-xl bg-subtle p-5 ring-1 ring-line">
                  <strong className="block text-fg">{title}</strong>
                  <span className="text-muted">{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="permissions-title">
            <h2 id="permissions-title" className="text-3xl font-bold tracking-tight text-fg">
              Permissions, explained
            </h2>
            <ul className="mt-6 space-y-4 text-body">
              <li>
                <strong className="text-fg">Storage</strong> — to save your profile in your browser.
              </li>
              <li>
                <strong className="text-fg">Read and change data on the websites you visit</strong>{' '}
                — application forms live on thousands of sites, often inside embedded frames, so
                JobFill’s form reader runs on web pages. It reads form fields and their labels (and
                a job posting’s text when you ask for an AI answer), sends nothing on its own, and
                writes to a page only when you click Autofill or Insert Answer.
              </li>
              <li>
                Nothing else: no browsing history, tabs, cookies, downloads or identity access.
              </li>
            </ul>
          </section>

          <section aria-labelledby="commitments-title">
            <h2 id="commitments-title" className="text-3xl font-bold tracking-tight text-fg">
              Our commitments
            </h2>
            <ul className="mt-6 space-y-4 text-body">
              <li>
                <strong className="text-fg">Retention.</strong> Your data stays in this browser
                until you delete it or uninstall JobFill. Nothing is kept on any JobFill server —
                there isn’t one.
              </li>
              <li>
                <strong className="text-fg">No selling or sharing.</strong> We don’t sell, rent or
                transfer your data to third parties, and don’t use it for advertising,
                creditworthiness or any purpose unrelated to filling in your applications.
              </li>
              <li>
                <strong className="text-fg">Chrome Web Store policy.</strong> JobFill’s use of
                information complies with the Chrome Web Store User Data Policy, including the
                Limited Use requirements.
              </li>
              <li>
                <strong className="text-fg">Changes.</strong> If how JobFill handles data changes,
                we’ll update this page and its date before the change ships.
              </li>
              {SUPPORT_EMAIL && (
                <li>
                  <strong className="text-fg">Contact.</strong> Questions about privacy? Email{' '}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </li>
              )}
            </ul>
          </section>

          <section
            aria-labelledby="website-title"
            className="rounded-xl bg-subtle p-7 ring-1 ring-line"
          >
            <h2 id="website-title" className="text-2xl font-bold tracking-tight text-fg">
              About this website
            </h2>
            <p className="mt-3 text-body">
              {SITE.name}’s website never receives your profile — that lives only in the extension.
              To see which pages are useful, the site uses{' '}
              <strong className="text-fg">Vercel Web Analytics</strong>: it counts page views (the
              page, referring site, country, and browser and device type) without cookies, and
              doesn’t identify you or follow you across other sites. There’s no advertising and no
              tracking cookies. If you pick a light or dark theme, that choice is saved in your
              browser’s local storage on your device and never sent anywhere. Like any website, our
              hosting provider (Vercel) keeps standard server logs for security and reliability.
            </p>
          </section>
        </div>
        <p className="mt-12 text-muted">
          Questions about a specific feature? See{' '}
          <Link href="/features/ai-answers" className="font-medium text-accent hover:underline">
            how AI answers work
          </Link>{' '}
          or the{' '}
          <Link href="/features/resume-parser" className="font-medium text-accent hover:underline">
            resume parser
          </Link>
          .
        </p>
      </Container>

      <FaqSection faqs={[...Object.values(PRIVACY_FAQS), AI_FAQS.history, AI_FAQS.key]} />
      <CtaBand title="Autofill applications without handing over your profile" />
    </>
  );
}
