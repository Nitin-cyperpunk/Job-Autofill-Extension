import { Container } from './ui';

/**
 * Platforms people commonly meet when applying. Logos are the brands' own marks via
 * Simple Icons (CC0), traced to each brand's asset page and stored in /public/logos in
 * their brand colours. Platforms whose logos can't be used without permission (LinkedIn,
 * Workday) or have no reliable official asset (Lever, Ashby) are left out rather than
 * approximated.
 */
const PLATFORMS = [
  { name: 'Google Forms', logo: '/logos/googleforms.svg' },
  { name: 'Greenhouse', logo: '/logos/greenhouse.svg' },
  { name: 'Indeed', logo: '/logos/indeed.svg' },
] as const;

/**
 * Identical copies of the list sit side by side; the track moves left by exactly one
 * copy, then restarts — the next copy is in the same place, so there's no jump. Enough
 * copies to cover the widest container plus one. Pure CSS (globals.css): no JavaScript.
 */
const COPIES = 6;

function LogoList() {
  return (
    <ul className="marquee-copy flex shrink-0 items-center gap-4 pr-4">
      {PLATFORMS.map((p) => (
        <li
          key={p.name}
          className="flex h-12 items-center gap-3 rounded-full border border-line bg-surface py-2 pr-5 pl-2 shadow-card"
        >
          {/* A white disc keeps brand colours legible in dark mode too. */}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-line">
            <img
              src={p.logo}
              alt=""
              width={18}
              height={18}
              loading="lazy"
              decoding="async"
              className="h-[18px] w-[18px]"
            />
          </span>
          <span className="text-sm font-semibold whitespace-nowrap text-fg">{p.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function PlatformMarquee() {
  return (
    <section aria-labelledby="platforms-title" className="border-b border-line py-14 sm:py-16">
      <Container>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <h2
            id="platforms-title"
            className="text-2xl font-bold tracking-tight text-fg sm:text-3xl"
          >
            One profile. More applications.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted sm:text-lg">
            JobFill helps you fill repetitive information across supported job application forms, so
            you can spend less time retyping and more time applying.
          </p>
        </div>
      </Container>

      {/* Read once by screen readers; the moving copies below are decorative. */}
      <ul className="sr-only">
        {PLATFORMS.map((p) => (
          <li key={p.name}>{p.name}</li>
        ))}
      </ul>

      <div className="marquee mx-auto mt-10 max-w-6xl overflow-hidden" aria-hidden="true">
        <div className="marquee-track flex w-max py-1" style={{ ['--copies' as string]: COPIES }}>
          {Array.from({ length: COPIES }, (_, i) => (
            <LogoList key={i} />
          ))}
        </div>
      </div>

      <Container>
        <p className="mt-8 text-center text-sm text-muted">
          Designed for use with common job application forms. Compatibility varies by application
          form.
        </p>
        <p className="mt-1 text-center text-xs text-faint">
          Logos are trademarks of their respective owners. JobFill isn’t affiliated with or endorsed
          by them.
        </p>
      </Container>
    </section>
  );
}
