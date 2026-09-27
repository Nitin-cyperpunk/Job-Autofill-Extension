import {
  CheckList,
  Container,
  CtaBand,
  FaqSection,
  PageHero,
  RelatedLinks,
  SectionHeading,
} from '@/components/ui';
import { RESUME_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Resume Parser: Turn Your Resume Into an Autofill Profile',
  description:
    'Import a PDF, Word or text resume and JobFill extracts your details on your own device. Review every value and resolve conflicts before anything is saved.',
  path: '/features/resume-parser',
  keywords: ['resume autofill', 'autofill resume', 'resume parser'],
});

const CRUMBS = [
  { name: 'Features', path: '/features' },
  { name: 'Resume parser', path: '/features/resume-parser' },
];

export default function ResumeParserPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="Resume parser"
        title="Turn your resume into an autofill profile — on your device"
        lead="Upload your resume once. JobFill reads it inside the extension on your computer, shows you everything it found, and saves only what you approve."
      >
        <p className="mt-6 inline-flex rounded-lg bg-ok-soft px-4 py-3 text-sm font-medium text-ok ring-1 ring-ok-line">
          Your resume stays on this device unless you choose an AI/cloud feature.
        </p>
      </PageHero>

      <section aria-labelledby="steps-title" className="py-16 sm:py-20">
        <Container>
          <SectionHeading id="steps-title" title="From resume to profile in four steps" />
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Upload', 'Choose a PDF, Word (.docx) or text file up to 5 MB — or paste the text.'],
              ['Extract', 'Text is extracted locally, without uploading the file anywhere.'],
              [
                'Review',
                'See every detail found, grouped by section, and untick anything that’s wrong.',
              ],
              ['Approve', 'Only what you approve is saved to your profile, on this device.'],
            ].map(([title, text], i) => (
              <li key={title} className="rounded-xl border border-line p-6">
                <span className="text-sm font-semibold text-accent">Step {i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-fg">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="finds-title" className="bg-subtle py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            id="finds-title"
            title="What it finds"
            lead="The resume parser recognises the sections most resumes use, in the order you wrote them."
          />
          <CheckList
            className="text-body"
            items={[
              'Name, email, phone and location',
              'LinkedIn, GitHub and portfolio links',
              'Current title and professional summary',
              'Work experience with titles, companies, dates and highlights',
              'Education with institution, degree, field and dates',
              'Skills, languages and certifications',
            ]}
          />
        </Container>
      </section>

      <section aria-labelledby="conflicts-title" className="py-16 sm:py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            id="conflicts-title"
            title="Never silently overwritten"
            lead="Updating an existing profile? Where your resume disagrees with what you saved, JobFill shows both and keeps your existing value unless you choose otherwise. Roles and schools you already have are recognised, not duplicated."
          />
          <div
            className="rounded-xl border border-line bg-surface p-6 shadow-card"
            aria-label="Example conflict"
          >
            <p className="text-sm font-semibold text-fg">Current job title</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-subtle p-4 ring-2 ring-accent">
                <p className="text-xs text-muted">Existing</p>
                <p className="font-medium text-fg">Product Designer</p>
                <p className="mt-3 text-sm font-semibold text-accent">Keep Existing ✓</p>
              </div>
              <div className="rounded-lg bg-subtle p-4 ring-1 ring-line">
                <p className="text-xs text-muted">Resume</p>
                <p className="font-medium text-fg">Senior Product Designer</p>
                <p className="mt-3 text-sm font-semibold text-muted">Use Resume Value</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">Illustration with example values.</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="tips-title" className="bg-subtle py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 id="tips-title" className="text-2xl font-bold tracking-tight text-fg">
            Getting the best results
          </h2>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-body">
            <li>Use a resume with real, selectable text — scanned images can’t be read.</li>
            <li>Clear section headings (“Experience”, “Education”, “Skills”) help most.</li>
            <li>
              Unusual layouts may need a few corrections in the review step — that’s what it’s for.
            </li>
          </ul>
        </Container>
      </section>

      <FaqSection faqs={Object.values(RESUME_FAQS)} />
      <RelatedLinks
        links={[
          {
            href: '/features/autofill',
            label: 'Job application autofill',
            text: 'Use your new profile on your next application.',
          },
          {
            href: '/privacy',
            label: 'Privacy',
            text: 'What stays on your device and what may leave it.',
          },
          {
            href: '/blog/job-application-tips',
            label: 'Job application tips',
            text: 'Make every application stronger.',
          },
        ]}
      />
      <CtaBand title="Import your resume and start autofilling" />
    </>
  );
}
