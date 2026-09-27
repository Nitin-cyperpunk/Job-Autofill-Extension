import type { ReactNode } from 'react';
import type { LinksInfo } from '@jobfill/types';
import { createOtherLink, scopeErrors } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import {
  CheckIcon,
  CloudFileIcon,
  FolderIcon,
  GitHubIcon,
  GlobeIcon,
  LinkedInIcon,
  PlusIcon,
  TrashIcon,
  XLogoIcon,
} from '@/components/ui/icons';
import type { SectionFormProps } from './types';
import { DetailList, ExternalLink } from './summary-ui';

type MainLink = Exclude<keyof LinksInfo, 'other'>;

const MAIN_LINKS: Array<{ key: MainLink; label: string; placeholder: string }> = [
  {
    key: 'resumeUrl',
    label: 'Resume link (Google Drive, Dropbox…)',
    placeholder: 'drive.google.com/file/d/…',
  },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/your-name' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'your-portfolio.com' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/your-name' },
  { key: 'x', label: 'X / Twitter', placeholder: 'x.com/your-handle' },
  { key: 'website', label: 'Personal website', placeholder: 'your-site.com' },
];

export function LinksForm({ value, onChange, errors }: SectionFormProps<'links'>) {
  const updateOther = (id: string, patch: { label?: string; url?: string }) =>
    onChange({ ...value, other: value.other.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {MAIN_LINKS.map(({ key, label, placeholder }) => (
          <TextField
            key={key}
            label={label}
            type="url"
            inputMode="url"
            placeholder={placeholder}
            value={value[key]}
            onChange={(v) => onChange({ ...value, [key]: v })}
            error={errors[key]}
          />
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-body">Other links</h3>
        <p className="mb-3 text-xs text-muted">
          Behance, Dribbble, Google Scholar, a blog — anything else.
        </p>
        <div className="space-y-3">
          {value.other.map((link, i) => {
            const err = scopeErrors(errors, `other.${i}`);
            return (
              <div key={link.id} className="grid items-start gap-3 sm:grid-cols-[1fr_2fr_auto]">
                <TextField
                  label="Label"
                  placeholder="e.g. Blog"
                  value={link.label}
                  onChange={(v) => updateOther(link.id, { label: v })}
                  error={err.label}
                />
                <TextField
                  label="URL"
                  type="url"
                  placeholder="https://"
                  value={link.url}
                  onChange={(v) => updateOther(link.id, { url: v })}
                  error={err.url}
                />
                <Button
                  variant="danger-ghost"
                  className="sm:mt-7"
                  aria-label={`Delete ${link.label || 'link'}`}
                  icon={<TrashIcon />}
                  onClick={() =>
                    onChange({ ...value, other: value.other.filter((l) => l.id !== link.id) })
                  }
                />
              </div>
            );
          })}
        </div>
        <Button
          variant="secondary"
          className="mt-3"
          icon={<PlusIcon />}
          onClick={() => onChange({ ...value, other: [...value.other, createOtherLink()] })}
        >
          Add link
        </Button>
      </div>
    </div>
  );
}

const LINK_ICONS: Record<MainLink, typeof GlobeIcon> = {
  resumeUrl: CloudFileIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  portfolio: FolderIcon,
  x: XLogoIcon,
  website: GlobeIcon,
};

/** Every main link with a ✓ / ○ status, so gaps are easy to spot (but not alarming). */
export function LinksSummary({ value }: { value: LinksInfo }) {
  return (
    <div className="space-y-4">
      <ul className="grid gap-2 sm:grid-cols-2">
        {MAIN_LINKS.map(({ key, label }) => {
          const Icon = LINK_ICONS[key];
          const url = value[key];
          return (
            <li
              key={key}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-line px-3 py-2"
            >
              <Icon
                className={url ? 'h-4 w-4 shrink-0 text-accent' : 'h-4 w-4 shrink-0 text-faint'}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted">{label}</span>
                <span className="block truncate text-sm">
                  {url ? (
                    <ExternalLink href={url} />
                  ) : (
                    <span className="text-faint">Not added</span>
                  )}
                </span>
              </span>
              {url ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                  <CheckIcon className="h-3 w-3" />
                  <span className="sr-only">Added</span>
                </span>
              ) : (
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-dashed border-line-strong"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ul>
      {value.other.length > 0 && (
        <DetailList
          rows={value.other.map((l, i): [string, ReactNode] => [
            l.label || `Link ${i + 1}`,
            <ExternalLink key={l.id} href={l.url} />,
          ])}
        />
      )}
    </div>
  );
}
