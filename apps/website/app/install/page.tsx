import Link from 'next/link';
import {
  AddToChromeButton,
  CheckList,
  Container,
  CtaBand,
  FaqSection,
  PageHero,
} from '@/components/ui';
import { GENERAL_FAQS, PRIVACY_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Install JobFill: Add the Job Application Extension to Chrome',
  description:
    'Install the JobFill Chrome extension in a few clicks, pin it to your toolbar and set up your profile. No account needed — your profile stays on your device.',
  path: '/install',
});

const CRUMBS = [{ name: 'Install', path: '/install' }];

const STEPS = [
  {
    title: 'Add JobFill to Chrome',
    text: 'Open the JobFill listing on the Chrome Web Store and click “Add to Chrome”, then “Add extension”.',
  },
  {
    title: 'Pin it to your toolbar',
    text: 'Click the puzzle-piece icon in Chrome’s toolbar and the pin next to JobFill, so it’s one click away on every application.',
  },
  {
    title: 'Set up your profile',
    text: 'JobFill opens its setup page. Import your resume or fill in your details — about as long as one application takes.',
  },
  {
    title: 'Fill your first application',
    text: 'Open a job application, click the JobFill icon and choose “Autofill Application”. Review, then submit.',
  },
];

export default function InstallPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Install"
        title="Install JobFill in Chrome"
        lead="A couple of minutes to install and set up. No account, no email address — your profile is created and kept on your device."
        cta={false}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <AddToChromeButton />
          <Link
            href="#get-started"
            className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold text-fg ring-1 ring-line-strong hover:bg-subtle"
          >
            Try JobFill — see the steps
          </Link>
        </div>
      </PageHero>

      <section
        id="get-started"
        aria-labelledby="steps-title"
        className="scroll-mt-20 py-16 sm:py-20"
      >
        <Container className="max-w-4xl">
          <h2 id="steps-title" className="text-3xl font-bold tracking-tight text-fg">
            Get started in four steps
          </h2>
          <ol className="mt-10 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5 rounded-xl border border-line p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1 text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="req-title" className="bg-subtle py-16 sm:py-20">
        <Container className="grid max-w-4xl gap-10 md:grid-cols-2">
          <div>
            <h2 id="req-title" className="text-2xl font-bold tracking-tight text-fg">
              Requirements
            </h2>
            <CheckList
              className="mt-5 text-body"
              items={[
                'Google Chrome on a desktop or laptop (Windows, macOS, Linux or ChromeOS)',
                'Your resume as a PDF, Word or text file — optional, but the fastest way to start',
                'For AI answers only: your own API key from an AI provider',
              ]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-fg">
              Permissions Chrome will show
            </h2>
            <p className="mt-5 text-body">
              When you add JobFill, Chrome warns that it can{' '}
              <em>“Read and change all your data on all websites”</em>. That lets it find and fill
              the job sites and application forms you use, including forms embedded in other pages.
              JobFill writes to a page only when you click Autofill or Insert Answer, and sends
              nothing on its own. The only other permission is storage — JobFill can’t see your tabs
              list or browsing history.{' '}
              <Link href="/privacy" className="font-medium text-accent hover:underline">
                Read the privacy details
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      <FaqSection
        faqs={[
          GENERAL_FAQS.browsers,
          GENERAL_FAQS.account,
          GENERAL_FAQS.free,
          PRIVACY_FAQS.permissions,
          PRIVACY_FAQS.delete,
        ]}
      />
      <CtaBand title="Ready for your next application?" />
    </>
  );
}
