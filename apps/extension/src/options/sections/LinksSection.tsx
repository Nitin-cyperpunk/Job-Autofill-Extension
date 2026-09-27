import type { ReactNode } from 'react';
import type { LinksInfo } from '@jobfill/types';
import { createOtherLink, scopeErrors } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import type { SectionFormProps } from './types';
import { DetailList, ExternalLink } from './summary-ui';

type MainLink = Exclude<keyof LinksInfo, 'other'>;

const MAIN_LINKS: Array<{ key: MainLink; label: string; placeholder: string }> = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/your-name' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/your-name' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'your-portfolio.com' },
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
        <h3 className="text-sm font-medium text-slate-700">Other links</h3>
        <p className="mb-3 text-xs text-slate-500">
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

export function LinksSummary({ value }: { value: LinksInfo }) {
  return (
    <DetailList
      rows={[
        ...MAIN_LINKS.map(({ key, label }): [string, ReactNode] => [
          label,
          value[key] && <ExternalLink href={value[key]} />,
        ]),
        ...value.other.map((l, i): [string, ReactNode] => [
          l.label || `Link ${i + 1}`,
          <ExternalLink key={l.id} href={l.url} />,
        ]),
      ]}
    />
  );
}
