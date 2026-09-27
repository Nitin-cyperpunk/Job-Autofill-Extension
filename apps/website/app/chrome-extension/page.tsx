import Link from 'next/link';
import { BoltIcon, FileIcon, ShieldIcon, SparkIcon } from '@/components/icons';
import { ProductMockup } from '@/components/ProductMockup';
import {
  CheckList,
  Container,
  CtaBand,
  FaqSection,
  FeatureCard,
  JsonLd,
  PageHero,
  RelatedLinks,
  SectionHeading,
} from '@/components/ui';
import { GENERAL_FAQS, PRIVACY_FAQS } from '@/content/faqs';
import { graph, webApplicationSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Chrome Extension for Job Applications',
  description:
    'JobFill is a Chrome extension for job applications: autofill forms from a profile on your device, import your resume, and review every field before you submit.',
  path: '/chrome-extension',
  keywords: [
    'Chrome extension for job applications',
    'job application autofill extension',
    'job application automation',
  ],
});

const CRUMBS = [{ name: 'Chrome extension', path: '/chrome-extension' }];

export default function ChromeExtensionPage() {
  return (
    <>
      <JsonLd data={graph(webApplicationSchema())} />
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Chrome extension"
        title="The Chrome extension for job applications that keeps your profile private"
        lead="JobFill adds a job application assistant to your browser. Save your profile once, then fill application forms in one click on the sites you already use — without an account and without sending your profile to a server."
      />

      <section aria-labelledby="why-title" className="py-16 sm:py-20">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="why-title"
              title="Why an extension?"
              lead="Applications happen in your browser, across many different sites. An extension can read each form where it is and fill it in place — no copying between tabs, no uploading your details to a third-party website."
            />
            <CheckList
              className="mt-8 text-body"
              items={[
                'Works on the application pages you already use',
                'Profile stored in your browser, not on a server',
                'Handles multi-step forms, iframes and custom dropdowns',
                'One click from the Chrome toolbar',
              ]}
            />
          </div>
          <div className="pb-10">
            <ProductMockup />
          </div>
        </Container>
      </section>

      <section aria-labelledby="what-title" className="bg-subtle py-16 sm:py-20">
        <Container>
          <SectionHeading id="what-title" title="What the extension does" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="Autofill" href="/features/autofill" icon={<BoltIcon />}>
              Fill personal details, experience, education and links in one click.
            </FeatureCard>
            <FeatureCard title="Resume parser" href="/features/resume-parser" icon={<FileIcon />}>
              Build your profile from your resume, parsed on your device.
            </FeatureCard>
            <FeatureCard title="AI answers" href="/features/ai-answers" icon={<SparkIcon />}>
              Optional drafts for open questions, with per-question consent.
            </FeatureCard>
            <FeatureCard title="Privacy" href="/privacy" icon={<ShieldIcon />}>
              No account, no JobFill server, no tracking in the extension.
            </FeatureCard>
          </div>
        </Container>
      </section>

      <section aria-labelledby="automation-title" className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 id="automation-title" className="text-3xl font-bold tracking-tight text-fg">
            Job application automation — with a human in charge
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            Some tools promise to apply to hundreds of jobs for you. JobFill doesn’t. It automates
            the typing, not the decisions: it fills what you’ve already told it, flags what it isn’t
            sure about, and leaves open questions, sensitive questions and the submit button to you.
            That keeps your applications accurate and genuinely yours.
          </p>
          <p className="mt-4 text-muted">
            New to autofill? Read{' '}
            <Link
              href="/blog/how-to-autofill-job-applications"
              className="font-medium text-accent hover:underline"
            >
              how to autofill job applications
            </Link>{' '}
            or see{' '}
            <Link href="/how-it-works" className="font-medium text-accent hover:underline">
              how JobFill works
            </Link>
            .
          </p>
        </Container>
      </section>

      <FaqSection
        faqs={[
          GENERAL_FAQS.free,
          GENERAL_FAQS.browsers,
          GENERAL_FAQS.sites,
          PRIVACY_FAQS.permissions,
          GENERAL_FAQS.submit,
        ]}
      />
      <RelatedLinks
        links={[
          {
            href: '/install',
            label: 'Install guide',
            text: 'Add JobFill to Chrome in a few clicks.',
          },
          {
            href: '/blog/best-job-application-tools',
            label: 'Best job application tools',
            text: 'Build a toolkit that respects your privacy.',
          },
          {
            href: '/blog/how-to-use-chrome-autofill-for-job-applications',
            label: 'Chrome autofill for job applications',
            text: 'What built-in autofill covers.',
          },
        ]}
      />
      <CtaBand />
    </>
  );
}
