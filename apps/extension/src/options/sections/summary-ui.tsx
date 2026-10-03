import { useContext, useMemo, type ReactNode } from 'react';
import { isHttpUrl } from '@jobfill/shared';
import { ProfileContext } from '@/profile/profile-context';

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

export type FieldNeed = 'optional' | 'manual' | 'core';

export interface StatusRow {
  label: string;
  value: ReactNode;
  /** Profile path, to show "From resume" when a resume import filled it. */
  path?: string;
  /**
   * What an empty value means: optional (fine to skip), manual (resumes don't include
   * it — add it yourself), core (expected on most applications).
   */
  need?: FieldNeed;
}

const EMPTY_TEXT: Record<FieldNeed, string> = {
  optional: 'Not provided — optional',
  manual: 'Not provided — add manually',
  core: 'Not provided',
};

/**
 * Every row with its status, so it's obvious what came from the resume and what still
 * needs typing in — and that "not on the resume" isn't the same as "missing".
 */
export function StatusList({ rows }: { rows: StatusRow[] }) {
  const fromResume = useResumeSources();
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => {
        const empty =
          row.value === '' || row.value === null || row.value === undefined || row.value === false;
        return (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">{row.label}</dt>
            <dd className="mt-0.5 text-sm break-words">
              {empty ? (
                <span className="text-faint">○ {EMPTY_TEXT[row.need ?? 'optional']}</span>
              ) : (
                <>
                  <span className="text-fg">{row.value}</span>
                  {row.path && fromResume.has(row.path) && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-ok-soft px-1.5 py-px align-middle text-[10px] font-medium text-ok">
                      ✓ From resume
                    </span>
                  )}
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Profile paths last filled by a résumé import (empty outside a ProfileProvider). */
export function useResumeSources(): ReadonlySet<string> {
  const paths = useContext(ProfileContext)?.profile.sources.resume;
  return useMemo(() => new Set(paths ?? []), [paths]);
}
