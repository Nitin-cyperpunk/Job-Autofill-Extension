import Link from 'next/link';
import {
  BoltIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  HandIcon,
  KeyIcon,
  LayersIcon,
  ShieldIcon,
  SparkIcon,
} from '@/components/icons';
import {
  CheckList,
  Container,
  CtaBand,
  FaqSection,
  FeatureCard,
  PageHero,
  SectionHeading,
} from '@/components/ui';
import { AUTOFILL_FAQS, GENERAL_FAQS, PRIVACY_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Features: Autofill, Resume Parser & Optional AI Answers',
  description:
    'Everything JobFill does: one-click job application autofill, an on-device resume parser, optional AI-drafted answers, preview mode and full control of your data.',
  path: '/features',
});

const CRUMBS = [{ name: 'Features', path: '/features' }];

const MAIN = [
  {
    href: '/features/autofill',
    title: 'Job application autofill',
    icon: <BoltIcon />,
    text: 'Fill personal details, experience, education, skills and links in one click on Google Forms, applicant tracking systems and custom forms.',
  },
  {
    href: '/features/resume-parser',
    title: 'Resume parser',
    icon: <FileIcon />,
    text: 'Import a PDF, Word or text resume. It’s read on your device, and you approve every detail before it’s saved.',
  },
  {
    href: '/features/ai-answers',
    title: 'AI answers (optional)',
    icon: <SparkIcon />,
    text: 'Draft answers to open questions with your own AI provider — with a consent screen that shows exactly what is sent.',
  },
  {
    href: '/privacy',
    title: 'Privacy by design',
    icon: <ShieldIcon />,
    text: 'A local-first profile, no account, no JobFill server and no tracking in the extension. See what stays and what may leave.',
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Features"
        title="Everything you need to fill job applications faster"
        lead="JobFill is a job application assistant for Chrome: it handles the repetitive typing, keeps your profile on your device, and leaves every decision to you."
      />

      <section aria-labelledby="core-title" className="py-16 sm:py-20">
        <Container>
          <SectionHeading id="core-title" title="Core features" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {MAIN.map((f) => (
              <FeatureCard key={f.href} title={f.title} href={f.href} icon={f.icon}>
                {f.text}
              </FeatureCard>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="control-title" className="bg-subtle py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="control-title"
            title="Designed to keep you in control"
            lead="Speed is only useful if you can trust the result."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard title="Preview before filling" icon={<EyeIcon />}>
              Turn on preview mode to see each detected field with the value JobFill plans to use,
              and untick anything.
            </FeatureCard>
            <FeatureCard title="Never submits" icon={<HandIcon />}>
              JobFill fills and summarises. Submitting an application is always your click.
            </FeatureCard>
            <FeatureCard title="Never overwrites" icon={<HandIcon />}>
              Fields that already have a value are left alone, and resume imports never replace
              profile details without your choice.
            </FeatureCard>
            <FeatureCard title="Sensitive questions stay yours" icon={<ShieldIcon />}>
              Diversity, identity and consent questions are never filled automatically.
            </FeatureCard>
            <FeatureCard title="Works on real-world forms" icon={<LayersIcon />}>
              Multi-step forms, fields revealed by earlier answers, iframes, shadow DOM and custom
              dropdowns.
            </FeatureCard>
            <FeatureCard title="Your data, portable" icon={<DownloadIcon />}>
              Export your profile to a file, import it in another browser, or delete everything in
              one step.
            </FeatureCard>
          </div>
        </Container>
      </section>

      <section aria-labelledby="not-title" className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            id="not-title"
            title="What JobFill deliberately doesn’t do"
            lead="Some things a job application tool shouldn’t do on your behalf."
          />
          <div>
            <CheckList
              className="text-body"
              items={[
                'Submit applications or click “Apply” for you',
                'Answer demographic or legal declaration questions',
                'Store a history of the jobs you apply to',
                'Send your profile to a JobFill server — there isn’t one',
                'Require an account or an email address',
              ]}
            />
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <KeyIcon className="h-5 w-5 text-faint" />
              AI is optional and uses your own API key.{' '}
              <Link href="/features/ai-answers" className="font-medium text-accent hover:underline">
                How AI answers work
              </Link>
            </p>
          </div>
        </Container>
      </section>

      <FaqSection
        faqs={[
          GENERAL_FAQS.what,
          AUTOFILL_FAQS.matching,
          AUTOFILL_FAQS.preview,
          GENERAL_FAQS.sensitive,
          PRIVACY_FAQS.leave,
        ]}
      />
      <CtaBand />
    </>
  );
}
