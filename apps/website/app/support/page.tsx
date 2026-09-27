import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ShareButton } from '@/components/ShareButton';
import { Breadcrumbs, Container, CtaBand, FaqSection } from '@/components/ui';
import type { Faq } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';
import { CHROME_WEB_STORE_URL, ISSUES_URL, LINKS, SITE, SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Support JobFill — Help Keep JobFill Growing',
  absoluteTitle: true,
  description:
    'Support JobFill and help continue development of a privacy-focused job application autofill tool — with a coffee, a GitHub star, or by sharing it.',
  path: '/support',
});

const CRUMBS = [{ name: 'Support', path: '/support' }];

const SHARE_TEXT = 'JobFill autofills job applications while keeping your profile on your device.';

const SUPPORT_FAQS: Faq[] = [
  {
    q: 'Is JobFill free to use?',
    a: 'Yes. Every feature is available to everyone, with no account. Supporting the project is entirely optional.',
  },
  {
    q: 'Does supporting unlock extra features?',
    a: 'No. There are no paid tiers or supporter-only features. Support simply helps the project keep going.',
  },
  {
    q: 'What does support pay for?',
    a: 'Development time, hosting for this website, testing across real application forms and browsers, and new features.',
  },
  {
    q: 'Does JobFill see my payment details?',
    a: 'No. Contributions are handled by the support platform you choose (such as Buy Me a Coffee). Supporting has no connection to your JobFill profile, which stays on your device.',
  },
  {
    q: 'Can I help without paying?',
    a: 'Absolutely — starring the repository, sharing JobFill with someone who’s job hunting, and reporting bugs or ideas all help a lot.',
  },
];

export default function SupportPage() {
  const shareUrl = SITE_URL;
  const encoded = encodeURIComponent(shareUrl);
  const shareLinks = [
    {
      label: 'X',
      href: `https://x.com/intent/post?text=${encodeURIComponent(SHARE_TEXT)}&url=${encoded}`,
    },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    {
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent('JobFill — job application autofill')}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${shareUrl}`)}`,
    },
  ];

  return (
    <>
      <section className="border-b border-line bg-subtle">
        <Container className="max-w-4xl py-14 text-center sm:py-20">
          <div className="flex justify-center">
            <Breadcrumbs crumbs={CRUMBS} />
          </div>
          <span
            aria-hidden="true"
            className="mx-auto mt-8 flex h-12 w-12 animate-pop items-center justify-center rounded-xl bg-accent-soft text-accent"
          >
            <HeartIcon />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Support JobFill
          </h1>
          <div className="animate-enter [animation-delay:80ms]">
            <p className="mt-3 text-lg font-medium text-accent">
              Built with curiosity, caffeine, and a lot of debugging.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
              {SITE.name} is built to make job applications a little less repetitive. If it saves
              you time and you enjoy using it, you can support the project and help me keep
              improving it. It’s completely optional — JobFill works the same either way.
            </p>
          </div>
        </Container>
      </section>

      <section id="get-help" aria-labelledby="help-now-title" className="scroll-mt-20 pt-12">
        <Container className="max-w-4xl">
          <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
            <h2 id="help-now-title" className="text-xl font-semibold text-fg">
              Need help instead?
            </h2>
            <p className="mt-2 text-body">
              Start with the{' '}
              <Link href="/faq#troubleshooting" className="font-medium text-accent hover:underline">
                troubleshooting FAQ
              </Link>
              .{' '}
              {SUPPORT_EMAIL ? (
                <>
                  Still stuck? Email{' '}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('JobFill help')}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </>
              ) : (
                <>A help email address will be listed here soon.</>
              )}
            </p>
            <p className="mt-2 text-sm text-muted">
              When reporting a problem, include the site’s address and which field didn’t fill — a
              screenshot of the popup’s debug panel (Advanced → Debug mode on your profile page)
              helps.
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="support-title" className="py-16 sm:py-20">
        <Container>
          <h2 id="support-title" className="text-3xl font-bold tracking-tight text-fg">
            Support the Project
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <SupportCard
              icon={<CoffeeIcon />}
              title="Buy Me a Coffee"
              text="Support development with a small contribution. Every coffee goes into building and testing JobFill."
              action={<BuyMeACoffeeButton href={LINKS.support} />}
            />
            <SupportCard
              icon={<GitHubIcon />}
              title="GitHub"
              text="If you like the project, consider starring the repository. Stars help other people find it."
              action={
                <ExternalAction href={LINKS.github} pending="GitHub link coming soon" secondary>
                  ★ Star on GitHub
                </ExternalAction>
              }
            />
            <SupportCard
              id="share"
              icon={<ShareIcon />}
              title="Share JobFill"
              text="Know someone who’s job hunting? Help them — and others — discover JobFill."
              action={
                <div className="space-y-3">
                  <ShareButton url={shareUrl} title={SITE.name} text={SHARE_TEXT} />
                  <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
                    <span>or share on</span>
                    {shareLinks.map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        rel="noopener nofollow"
                        target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                        className="font-medium text-accent transition-colors hover:text-fg"
                      >
                        {l.label}
                        {!l.href.startsWith('mailto:') && (
                          <span className="sr-only"> (opens in a new tab)</span>
                        )}
                      </a>
                    ))}
                  </p>
                </div>
              }
            />
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Your support helps fund development, hosting, testing, and new features. Thank you. 💙
          </p>
        </Container>
      </section>

      <section
        aria-labelledby="help-title"
        className="border-y border-line bg-subtle py-16 sm:py-20"
      >
        <Container className="max-w-4xl">
          <h2 id="help-title" className="text-3xl font-bold tracking-tight text-fg">
            Other Ways to Help
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            <HelpItem title="Report a bug or suggest a feature">
              {ISSUES_URL ? (
                <>
                  Open an issue on{' '}
                  <a
                    href={ISSUES_URL}
                    rel="noopener"
                    className="font-medium text-accent hover:underline"
                  >
                    GitHub
                  </a>
                  . A form that doesn’t fill correctly is especially useful to hear about.
                </>
              ) : (
                <>
                  Feedback about forms that don’t fill correctly is especially useful. A feedback
                  link will be added here soon.
                </>
              )}
            </HelpItem>
            <HelpItem title="Leave a review">
              {CHROME_WEB_STORE_URL ? (
                <>
                  An honest review on the{' '}
                  <a
                    href={CHROME_WEB_STORE_URL}
                    rel="noopener"
                    className="font-medium text-accent hover:underline"
                  >
                    Chrome Web Store
                  </a>{' '}
                  helps other job seekers decide whether JobFill is for them.
                </>
              ) : (
                <>
                  An honest review on the Chrome Web Store, once it’s listed, helps others decide.
                </>
              )}
            </HelpItem>
            <HelpItem title="Tell a friend">
              Job searches are tiring. Point someone to{' '}
              <Link href="/how-it-works" className="font-medium text-accent hover:underline">
                how JobFill works
              </Link>
              .
            </HelpItem>
            <HelpItem title="Share a guide">
              Our{' '}
              <Link href="/blog" className="font-medium text-accent hover:underline">
                job application guides
              </Link>{' '}
              are free to read and share.
            </HelpItem>
          </ul>
        </Container>
      </section>

      <FaqSection faqs={SUPPORT_FAQS} title="Frequently Asked Questions" />
      <CtaBand
        title="Haven’t tried JobFill yet?"
        text="Save your profile once and autofill your next application — your data stays on your device."
      />
    </>
  );
}

function SupportCard({
  id,
  icon,
  title,
  text,
  action,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <article
      id={id}
      className="flex scroll-mt-24 flex-col rounded-xl border border-line bg-surface p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-2 flex-1 text-muted">{text}</p>
      <div className="mt-6">{action}</div>
    </article>
  );
}

/** A configured external link, or a clearly marked placeholder when it isn't set yet. */
function ExternalAction({
  href,
  pending,
  secondary = false,
  children,
}: {
  href: string;
  pending: string;
  secondary?: boolean;
  children: ReactNode;
}) {
  const base =
    'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-150 ease-out';
  if (!href) {
    return (
      <span
        className={`${base} cursor-not-allowed border border-dashed border-line-strong text-muted`}
      >
        {pending}
      </span>
    );
  }
  return (
    <a
      href={href}
      rel="noopener"
      className={`${base} active:scale-[0.98] ${
        secondary
          ? 'bg-surface text-fg ring-1 ring-line-strong hover:bg-subtle'
          : 'bg-brand-600 text-white hover:bg-brand-700'
      }`}
    >
      {children}
    </a>
  );
}

/**
 * Buy Me a Coffee's official button artwork (from their button generator), served from
 * this site rather than their CDN so visitors make no third-party request until they click.
 */
function BuyMeACoffeeButton({ href }: { href: string }) {
  if (!href) {
    return (
      <ExternalAction href="" pending="Support link coming soon">
        Support the Project
      </ExternalAction>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="block rounded-lg transition duration-150 ease-out hover:-translate-y-0.5 hover:opacity-95 active:scale-[0.98]"
    >
      <Image
        src="/bmc-button.png"
        alt="Buy me a coffee"
        width={545}
        height={153}
        className="mx-auto h-auto w-full max-w-[217px]"
      />
      <span className="sr-only"> (opens buymeacoffee.com in a new tab)</span>
    </a>
  );
}

function HelpItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <h3 className="font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{children}</p>
    </li>
  );
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function HeartIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M12 3v2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="m8.3 10.8 6.4-3.6M8.3 13.2l6.4 3.6" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}
