import {
  CheckList,
  Container,
  CtaBand,
  FaqSection,
  PageHero,
  RelatedLinks,
  SectionHeading,
} from '@/components/ui';
import { AI_FAQS } from '@/content/faqs';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'AI Job Application Assistant: Optional AI Answers',
  description:
    'Draft answers to open application questions with your own AI provider. Off by default; you see and approve exactly what is sent. Never your name or contact details.',
  path: '/features/ai-answers',
  keywords: ['AI job application assistant', 'job application assistant', 'AI answers'],
});

const CRUMBS = [
  { name: 'Features', path: '/features' },
  { name: 'AI answers', path: '/features/ai-answers' },
];

export default function AiAnswersPage() {
  return (
    <>
      <PageHero
        crumbs={CRUMBS}
        eyebrow="AI answers — optional"
        title="An AI job application assistant that asks before it sends"
        lead="Stuck on “Why do you want to work here?” Turn on AI answers and JobFill drafts three versions for you to choose from and edit. It’s off by default, and nothing is sent until you’ve seen exactly what will be used."
      />

      <section aria-labelledby="flow-title" className="py-16 sm:py-20">
        <Container>
          <SectionHeading id="flow-title" title="How it works" />
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              [
                'Pick a question',
                'After autofill, open questions are listed. Choose “Generate with AI” on one.',
              ],
              [
                'See what will be used',
                'A consent screen lists each item — job details, relevant skills, experience — with its exact text. Untick anything.',
              ],
              [
                'Generate',
                'JobFill sends only the approved items to the provider you chose and gets three drafts: balanced, concise and professional.',
              ],
              [
                'Edit and insert',
                'Choose a draft, edit it, and click Insert Answer. The form is never submitted.',
              ],
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

      <section aria-labelledby="data-title" className="bg-subtle py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="data-title"
            title="Minimum data, maximum clarity"
            lead="JobFill proposes only what one question needs, and some details are never sent at all."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-surface p-7 ring-1 ring-line">
              <h3 className="text-lg font-semibold text-fg">
                May be sent — only if you leave it ticked
              </h3>
              <CheckList
                className="mt-4 text-body"
                items={[
                  'The question itself',
                  'Job title, company and job description from the page',
                  'Your current role and relevant skills',
                  'Up to two relevant roles with short highlights',
                  'Education, when the question is about it',
                  'Your professional summary (never pre-ticked)',
                ]}
              />
            </div>
            <div className="rounded-xl bg-surface p-7 ring-1 ring-line">
              <h3 className="text-lg font-semibold text-fg">Never sent</h3>
              <ul className="mt-4 space-y-3 text-body">
                {[
                  'Your name',
                  'Email, phone and address',
                  'LinkedIn, GitHub and website links',
                  'Salary expectations',
                  'Work authorization or sponsorship answers',
                  'Demographic answers',
                  'Your resume file',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="font-bold text-danger">
                      ✕
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="providers-title" className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            id="providers-title"
            title="Your provider, your key"
            lead="JobFill doesn’t ship with an AI key or route requests through a JobFill server. Requests go directly from the extension in your browser to the provider you choose."
          />
          <CheckList
            className="text-body"
            items={[
              'OpenAI, Google Gemini, or any OpenAI-compatible endpoint — including a model server on your own computer',
              'Your API key is stored only in your browser on your device, and you can remove it at any time',
              'The consent screen names the destination on every request',
              'No AI history: drafts disappear when you close the popup',
              'The provider’s own privacy policy and retention terms apply to what you send',
            ]}
          />
        </Container>
      </section>

      <FaqSection faqs={Object.values(AI_FAQS)} />
      <RelatedLinks
        links={[
          {
            href: '/privacy',
            label: 'Privacy',
            text: 'Exactly what may leave your device, and why.',
          },
          {
            href: '/blog/job-application-tips',
            label: 'Job application tips',
            text: 'Make open answers specific and true.',
          },
          { href: '/features/autofill', label: 'Autofill', text: 'The part that never uses AI.' },
        ]}
      />
      <CtaBand title="Autofill first. AI only when you want it." />
    </>
  );
}
