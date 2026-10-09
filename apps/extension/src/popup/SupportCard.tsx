import { SUPPORT_URL } from '@/utils/links';

/**
 * An optional, quiet "support the project" note at the bottom of the popup. Only ever
 * opened by the user's click; it never blocks anything, touches pages or sends data.
 */
export function SupportCard() {
  if (!SUPPORT_URL) return null;
  return (
    <section
      aria-labelledby="support-heading"
      className="mt-4 rounded-lg border border-line bg-subtle p-3"
    >
      <h2 id="support-heading" className="text-sm font-semibold text-fg">
        Enjoying JobFill?
      </h2>
      <p className="mt-0.5 text-xs text-muted">
        If JobFill has genuinely helped with your job applications, consider supporting its
        continued development.
      </p>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // A normal new tab, the same way the popup opens its other pages.
          e.preventDefault();
          void chrome.tabs.create({ url: SUPPORT_URL });
        }}
        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 text-xs font-medium text-fg shadow-card transition-[background-color,transform] duration-150 ease-out hover:bg-subtle-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        Buy me a coffee <span aria-hidden="true">☕</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  );
}
