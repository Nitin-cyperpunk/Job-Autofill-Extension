import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { breadcrumbSchema, faqSchema, graph, type Crumb, type Faq } from '@/lib/schema';
import { CHROME_WEB_STORE_URL, SITE, TRY_HREF } from '@/lib/site';

/* Server components only: the site ships no component JavaScript of its own. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  // A caller's max-w-* replaces the default rather than competing with it in the cascade.
  const width = className?.includes('max-w-') ? '' : 'max-w-6xl';
  return <div className={cx('mx-auto w-full px-5 sm:px-8', width, className)}>{children}</div>;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so content can never close the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <Image src="/logo-48.png" alt="" width={28} height={28} className="rounded-md" priority />
      <span className="text-lg font-bold tracking-tight text-fg">{SITE.name}</span>
    </span>
  );
}

export function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".25" />
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <path
        d="M12 7.8h8.6M8.4 14.1 4.1 6.6M15.6 14.1l-4.3 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
      <path
        d="M4 10h11m-4-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
      <path
        d="m4.5 10.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
      <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const button = {
  // Press feedback is a 2% scale (transform only); colour changes ease over 150ms.
  base: 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold transition duration-150 ease-out active:scale-[0.98]',
  primary:
    'bg-brand-600 text-white shadow-card hover:scale-[1.015] hover:bg-brand-700 hover:shadow-raised',
  secondary: 'bg-surface text-fg ring-1 ring-line-strong hover:scale-[1.015] hover:bg-subtle',
  onDark: 'bg-white/10 text-white ring-1 ring-white/30 hover:scale-[1.015] hover:bg-white/20',
};

export function AddToChromeButton({
  className,
  label = 'Add to Chrome',
}: {
  className?: string;
  label?: string;
}) {
  // Same tab, like any other link to install a Chrome extension.
  return (
    <a href={CHROME_WEB_STORE_URL} className={cx(button.base, button.primary, className)}>
      <ChromeIcon className="h-5 w-5" />
      {label}
      <span className="sr-only"> — opens the Chrome Web Store</span>
    </a>
  );
}

export function TryButton({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return (
    <Link
      href={TRY_HREF}
      className={cx('group', button.base, onDark ? button.onDark : button.secondary, className)}
    >
      Try JobFill
      <ArrowIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** The two conversion actions every important page carries. */
export function CtaButtons({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      <AddToChromeButton />
      <TryButton onDark={onDark} />
    </div>
  );
}

export function CtaBand({
  title = 'Stop retyping your résumé into every application.',
  text = 'Set up your profile once. JobFill fills the form; you review and submit.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-20">
      <Container>
        {/* Always a dark panel, in both themes; outlined in dark mode so it doesn't merge with the page. */}
        <div
          data-reveal
          className="rounded-2xl bg-ink px-6 py-12 text-center ring-1 ring-ink-line sm:px-12 sm:py-16"
        >
          <div>
            <h2
              id="cta-title"
              className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">{text}</p>
            <CtaButtons onDark className="mt-8 justify-center" />
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400">
              <LockIcon className="h-4 w-4 text-emerald-400" />
              Your profile is stored on your device. No account needed.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const all = [{ name: 'Home', path: '/' }, ...crumbs];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((crumb, i) => (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-body">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.path} className="hover:text-accent">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={graph(breadcrumbSchema(crumbs))} />
    </>
  );
}

export function PageHero({
  crumbs,
  eyebrow,
  title,
  lead,
  cta = true,
  children,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  lead: ReactNode;
  cta?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-subtle">
      <Container className="py-12 sm:py-16">
        <div data-hero>
          {crumbs && (
            <div>
              <Breadcrumbs crumbs={crumbs} />
            </div>
          )}
          {eyebrow && (
            <p className="mt-6 text-sm font-semibold tracking-wide text-accent uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance text-fg sm:text-5xl">
            {title}
          </h1>
          {/* The heading (the LCP element) stays opaque; what follows eases in (globals.css). */}
          <div>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{lead}</p>
            {cta && <CtaButtons className="mt-8" />}
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  center = false,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  center?: boolean;
}) {
  return (
    <div data-reveal className={cx('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>
      )}
      <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-4 text-lg leading-8 text-muted">{lead}</p>}
    </div>
  );
}

export function CheckList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cx('space-y-3', className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-ok" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureCard({
  title,
  href,
  children,
  icon,
}: {
  title: string;
  href?: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-line bg-surface p-6 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-200 ease-out group-hover:scale-105">
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-semibold text-fg">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <div className="mt-2 flex-1 text-muted">{children}</div>
      {href && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
          Learn more{' '}
          <ArrowIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      )}
    </div>
  );
}

/** Visible FAQ (native <details>, no JS) plus matching FAQPage structured data. */
export function FaqSection({
  faqs,
  title = 'Frequently asked questions',
  id = 'faq',
  schema = true,
}: {
  faqs: Faq[];
  title?: string;
  id?: string;
  schema?: boolean;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="py-16 sm:py-20" id={id}>
      <Container className="max-w-3xl">
        <h2 id={`${id}-title`} className="text-3xl font-bold tracking-tight text-fg">
          {title}
        </h2>
        <FaqList faqs={faqs} className="mt-8" />
      </Container>
      {schema && <JsonLd data={graph(faqSchema(faqs))} />}
    </section>
  );
}

export function FaqList({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <div data-faq className={cx('divide-y divide-line border-y border-line', className)}>
      {faqs.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex items-start justify-between gap-6 rounded-md text-left text-lg font-semibold text-fg transition-colors hover:text-accent">
            <h3 className="text-lg font-semibold">{f.q}</h3>
            <span
              aria-hidden="true"
              className="mt-1 text-xl leading-none text-faint transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 animate-fade leading-7 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function RelatedLinks({
  title = 'Keep reading',
  links,
}: {
  title?: string;
  links: Array<{ href: string; label: string; text?: string }>;
}) {
  return (
    <section aria-labelledby="related-title" className="border-t border-line bg-subtle py-14">
      <Container>
        <h2 id="related-title" className="text-2xl font-bold tracking-tight text-fg">
          {title}
        </h2>
        <ul data-reveal-stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block h-full rounded-xl border border-line bg-surface p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-accent-line hover:shadow-raised"
              >
                <span className="font-semibold text-fg">{l.label}</span>
                {l.text && <span className="mt-1 block text-sm text-muted">{l.text}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
