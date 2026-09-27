import Link from 'next/link';
import { CREATOR, LINKS, NAV, SITE } from '@/lib/site';
import { MobileMenu } from './MobileMenu';
import { NavLinks } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';
import { AddToChromeButton, Container, LockIcon, Logo } from './ui';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-fg"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${SITE.name} home`} className="shrink-0 rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks items={NAV} />
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <AddToChromeButton label="Get JobFill" className="px-4! py-2! text-sm! max-sm:hidden" />
          <MobileMenu
            items={[...NAV, { href: '/faq', label: 'FAQ' }, { href: '/install', label: 'Install' }]}
          />
        </div>
      </Container>
    </header>
  );
}

type FooterLink = { href: string; label: string; external?: boolean };

/** Footer columns. Links that aren't configured yet (docs, terms, GitHub, X) are left out. */
function footerColumns(): Array<{ title: string; links: FooterLink[] }> {
  const ext = (href: string, label: string): FooterLink[] =>
    href ? [{ href, label, external: true }] : [];
  return [
    {
      title: 'Product',
      links: [
        { href: '/features', label: 'Features' },
        { href: '/how-it-works', label: 'How it works' },
        { href: '/install', label: 'Install' },
        { href: '/support', label: 'Support' },
      ],
    },
    {
      title: 'Resources',
      links: [
        ...ext(LINKS.docs, 'Documentation'),
        { href: '/faq', label: 'FAQ' },
        { href: '/blog', label: 'Blog' },
        { href: '/privacy', label: 'Privacy' },
        ...ext(LINKS.terms, 'Terms'),
      ],
    },
    {
      title: 'Community',
      links: [
        ...ext(LINKS.github, 'GitHub'),
        ...ext(LINKS.x, 'X / Twitter'),
        { href: '/support#share', label: 'Share JobFill' },
        { href: '/chrome-extension', label: 'Chrome extension' },
      ],
    },
  ];
}

export function SiteFooter() {
  const year = new Date(SITE.lastUpdated).getFullYear();
  return (
    <footer className="border-t border-line bg-subtle">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label={`${SITE.name} home`} className="inline-block rounded-md">
            <Logo />
          </Link>
          <p className="mt-4 text-base font-medium text-fg">{SITE.slogan}</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{SITE.tagline}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
            <LockIcon className="h-4 w-4 text-ok" />
            No account. No tracking on this site.
          </p>
        </div>
        {footerColumns().map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-fg">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a
                      href={l.href}
                      rel="noopener"
                      className="text-muted transition-colors duration-150 hover:text-accent"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-muted transition-colors duration-150 hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {SITE.name}
          <span className="mx-2 text-faint" aria-hidden="true">
            ·
          </span>
          <span className="text-faint">Chrome is a trademark of Google LLC.</span>
        </p>
        <CreatorSignature />
      </Container>
    </footer>
  );
}

/** A quiet creator signature — smaller than the JobFill brand, recognisable on hover. */
function CreatorSignature() {
  const name = <span className="font-semibold tracking-wide text-body">{CREATOR.name}</span>;
  const cls =
    'inline-block rounded-md opacity-80 transition duration-200 ease-out hover:-translate-y-px hover:opacity-100';
  return LINKS.creator ? (
    <a href={LINKS.creator} rel="noopener" className={cls}>
      Crafted by {name}
    </a>
  ) : (
    <p className={cls}>Crafted by {name}</p>
  );
}
