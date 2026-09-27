import Link from 'next/link';
import {
  BoltIcon,
  EyeIcon,
  FileIcon,
  FormIcon,
  HandIcon,
  LayersIcon,
  ShieldIcon,
  SparkIcon,
} from '@/components/icons';
import { ProductMockup } from '@/components/ProductMockup';
import {
  CheckIcon,
  CheckList,
  Container,
  CtaBand,
  CtaButtons,
  FaqSection,
  FeatureCard,
  JsonLd,
  LockIcon,
  SectionHeading,
} from '@/components/ui';
import { AI_FAQS, GENERAL_FAQS, PRIVACY_FAQS, RESUME_FAQS } from '@/content/faqs';
import { POSTS } from '@/content/blog';
import { graph, webApplicationSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'JobFill — Job Application Autofill Chrome Extension',
  absoluteTitle: true,
  description:
    'Autofill job applications in Chrome from a profile kept on your device. Import your resume, fill forms in one click, review every field, submit when ready.',
  path: '/',
  keywords: [
    'job application autofill',
    'job application autofill extension',
    'Chrome extension for job applications',
    'autofill job applications',
    'resume autofill',
  ],
});

const HOME_FAQS = [
  GENERAL_FAQS.what,
  GENERAL_FAQS.free,
  PRIVACY_FAQS.where,
  PRIVACY_FAQS.leave,
  GENERAL_FAQS.submit,
  GENERAL_FAQS.sites,
  RESUME_FAQS.upload,
  AI_FAQS.required,
];

const STEPS = [
  {
    title: 'Import your resume',
    text: 'JobFill reads your PDF or Word resume on your computer and shows what it found. You approve each detail.',
  },
  {
    title: 'Open an application',
    text: 'Company careers pages, applicant tracking systems or Google Forms — click the JobFill icon.',
  },
  {
    title: 'Autofill, review, submit',
    text: 'JobFill fills what matches and flags what needs you. You check the form and submit it yourself.',
  },
];

const FORMS = [
  'Google Forms',
  'Greenhouse-style application pages',
  'Lever-style application pages',
  'Workday-style multi-step forms',
  'Custom dropdowns and comboboxes',
  'Forms embedded in iframes',
  'Modern React and JavaScript forms',
  'Plain HTML forms',
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={graph(webApplicationSchema())} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-subtle">
        <Container className="grid items-center gap-16 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-medium text-ok ring-1 ring-ok-line">
              <LockIcon className="h-4 w-4 text-ok" />
              Local-first Chrome extension
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-fg sm:text-5xl lg:text-6xl">
              Autofill job applications faster —{' '}
              <span className="text-accent">keep your profile on your device.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              JobFill fills in application forms from a profile you save once: your details,
              experience, education, links and resume. You review every field and submit when you’re
              ready.
            </p>
            <CtaButtons className="mt-8" />
            <ul className="mt-8 grid gap-x-6 gap-y-2 text-sm text-muted sm:grid-cols-2">
              {[
                'No account needed',
                'Never submits for you',
                'Resume parsed on your device',
                'AI optional, off by default',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-ok" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="pb-10">
            <ProductMockup />
          </div>
        </Container>
      </section>

      {/* Problem */}
      <section aria-labelledby="problem-title" className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            id="problem-title"
            eyebrow="The problem"
            title="Every application asks for the same things"
            lead="Name, email, phone, work history, education, links, resume — typed again for every employer, on a different form each time. It’s slow, and it’s where typos slip in."
          />
          <div className="rounded-xl border border-line bg-subtle p-7">
            <p className="font-semibold text-fg">JobFill takes the repetitive part:</p>
            <CheckList
              className="mt-4 text-body"
              items={[
                'Fills personal details, experience, education, skills and links in one click',
                'Chooses matching options in dropdowns, radio buttons and checkboxes',
                'Attaches your saved resume to standard upload fields',
                'Tells you exactly which fields still need your attention',
              ]}
            />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="steps-title" className="bg-subtle py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="steps-title"
            eyebrow="How it works"
            title="Set up once. Fill in seconds."
            center
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl bg-surface p-7 shadow-card ring-1 ring-line"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-center">
            <Link href="/how-it-works" className="font-semibold text-accent hover:underline">
              See the full walkthrough →
            </Link>
          </p>
        </Container>
      </section>

      {/* Features */}
      <section aria-labelledby="features-title" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="features-title"
            eyebrow="Features"
            title="A job application assistant that stays out of your way"
            lead="Everything you need to fill applications quickly and accurately — and nothing that acts without you."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="One-click autofill" href="/features/autofill" icon={<BoltIcon />}>
              Understands the many ways forms ask for the same thing, and flags anything it isn’t
              sure about.
            </FeatureCard>
            <FeatureCard title="Resume parser" href="/features/resume-parser" icon={<FileIcon />}>
              Turn your PDF or Word resume into a profile — read on your device, reviewed by you.
            </FeatureCard>
            <FeatureCard
              title="Optional AI answers"
              href="/features/ai-answers"
              icon={<SparkIcon />}
            >
              Draft open answers with your own AI provider. You see exactly what’s sent, every time.
            </FeatureCard>
            <FeatureCard title="Privacy by design" href="/privacy" icon={<ShieldIcon />}>
              Your profile is stored in your browser. No account, no JobFill server, no tracking.
            </FeatureCard>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <FeatureCard title="Preview before filling" icon={<EyeIcon />}>
              See every value before it goes in, and untick anything you’d rather type yourself.
            </FeatureCard>
            <FeatureCard title="You stay in control" icon={<HandIcon />}>
              Never submits. Never overwrites what you typed. Leaves sensitive questions to you.
            </FeatureCard>
            <FeatureCard title="Works where forms live" icon={<LayersIcon />}>
              Multi-step forms, embedded iframes and custom dropdowns, not just simple pages.
            </FeatureCard>
          </div>
        </Container>
      </section>

      {/* Compatibility */}
      <section aria-labelledby="compat-title" className="bg-ink py-16 text-white sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-wide text-brand-200 uppercase">
              Compatibility
            </p>
            <h2 id="compat-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the forms you actually meet
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              JobFill reads each field’s label and context the way you do, so it works on standard
              web forms across sites — including the application forms common on hiring platforms.
              When a field is ambiguous, it leaves it for you instead of guessing.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Tested on sample pages built like these platforms. Live sites change, so some fields
              may need manual entry.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FORMS.map((form) => (
              <li
                key={form}
                className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3 ring-1 ring-white/10"
              >
                <FormIcon className="h-5 w-5 shrink-0 text-brand-200" />
                <span className="text-sm">{form}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Privacy */}
      <section aria-labelledby="privacy-title" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="privacy-title"
            eyebrow="Privacy"
            title="Your profile stays on your device"
            lead="JobFill is local-first. Your data only goes somewhere when you use a feature that needs it — and we tell you exactly where."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-ok-line bg-ok-soft p-7">
              <h3 className="text-lg font-semibold text-fg">What stays on your device</h3>
              <CheckList
                className="mt-4 text-body"
                items={[
                  'Your profile, saved resume and settings — in your browser’s extension storage',
                  'Your resume while it’s being parsed',
                  'No AI history, no record of the sites you apply to',
                ]}
              />
            </div>
            <div className="rounded-xl border border-line p-7">
              <h3 className="text-lg font-semibold text-fg">
                What may leave it — only when you act
              </h3>
              <ul className="mt-4 space-y-3 text-body">
                <li>
                  <strong className="text-fg">Autofill:</strong> the details filled into a form go
                  to that website, just as if you had typed them.
                </li>
                <li>
                  <strong className="text-fg">AI answers (optional):</strong> only the details you
                  approve for one question, sent to the provider you chose.
                </li>
                <li>
                  <strong className="text-fg">Export:</strong> a backup file saved where you choose.
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-8">
            <Link href="/privacy" className="font-semibold text-accent hover:underline">
              Read the full privacy explanation →
            </Link>
          </p>
        </Container>
      </section>

      <FaqSection faqs={HOME_FAQS} />

      {/* Blog */}
      <section aria-labelledby="guides-title" className="border-t border-line bg-subtle py-16">
        <Container>
          <SectionHeading
            id="guides-title"
            eyebrow="Guides"
            title="Job search productivity guides"
          />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block h-full rounded-xl border border-line bg-surface p-5 hover:border-accent-line hover:shadow-card"
                >
                  <span className="font-semibold text-fg">{p.title}</span>
                  <span className="mt-2 block text-sm text-muted">{p.description}</span>
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
