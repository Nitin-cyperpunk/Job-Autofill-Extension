import type { ReactNode } from 'react';
import { isHttpUrl } from '@jobfill/shared';

/** Read-only building blocks shared by every section summary. */

export function NotProvided({ children = 'Nothing added yet.' }: { children?: ReactNode }) {
  return <p className="text-sm text-faint italic">{children}</p>;
}

/** Definition list that silently skips empty rows. */
export function DetailList({ rows }: { rows: Array<[label: string, value: ReactNode]> }) {
  const filled = rows.filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false);
  if (filled.length === 0) return <NotProvided />;
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {filled.map(([label, value], i) => (
        <div key={`${label}-${i}`} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
          <dd className="mt-0.5 text-sm break-words text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag} className="rounded-md bg-subtle-2 px-2 py-0.5 text-xs font-medium text-body">
          {tag}
        </li>
      ))}
    </ul>
  );
}

/** Only ever renders http(s) links (validated on save, re-checked here). */
export function ExternalLink({ href, children }: { href: string; children?: ReactNode }) {
  if (!isHttpUrl(href)) return <span>{href}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-accent underline-offset-2 hover:underline"
    >
      {children ?? href.replace(/^https?:\/\/(www\.)?/, '')}
    </a>
  );
}

export function EntrySummary({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <li className="border-l-2 border-accent-line py-0.5 pl-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      {children && <div className="mt-2 space-y-2">{children}</div>}
    </li>
  );
}

export function Clamp({ text }: { text: string }) {
  return <p className="line-clamp-3 text-sm whitespace-pre-line text-muted">{text}</p>;
}
