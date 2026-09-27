import type { CertificationEntry } from '@jobfill/types';
import { createCertificationEntry, formatMonth } from '@jobfill/shared';
import { EntryList } from '@/components/ui/EntryList';
import { TextField } from '@/components/ui/Field';
import type { SectionFormProps } from './types';
import { EntrySummary, ExternalLink, NotProvided } from './summary-ui';

export function CertificationsForm({
  value,
  onChange,
  errors,
}: SectionFormProps<'certifications'>) {
  return (
    <EntryList
      items={value}
      onChange={onChange}
      create={createCertificationEntry}
      errors={errors}
      addLabel="Add certification"
      emptyText="No certifications added yet. Licences and courses count too."
      itemTitle={(c, i) => c.name || `Certification ${i + 1}`}
      itemSubtitle={(c) => [c.issuer, formatMonth(c.date)].filter(Boolean).join(' · ')}
      renderItem={(c, update, err) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            required
            className="sm:col-span-2"
            placeholder="e.g. AWS Certified Solutions Architect"
            value={c.name}
            onChange={(v) => update({ name: v })}
            error={err.name}
          />
          <TextField
            label="Issuer"
            placeholder="e.g. Amazon Web Services"
            value={c.issuer}
            onChange={(v) => update({ issuer: v })}
            error={err.issuer}
          />
          <TextField
            label="Date"
            type="month"
            value={c.date}
            onChange={(v) => update({ date: v })}
            error={err.date}
          />
          <TextField
            label="Credential URL"
            type="url"
            className="sm:col-span-2"
            placeholder="https://"
            value={c.url}
            onChange={(v) => update({ url: v })}
            error={err.url}
          />
        </div>
      )}
    />
  );
}

export function CertificationsSummary({ value }: { value: CertificationEntry[] }) {
  if (value.length === 0) return <NotProvided />;
  return (
    <ul className="space-y-3">
      {value.map((c) => (
        <EntrySummary key={c.id} title={c.name} subtitle={c.issuer} meta={formatMonth(c.date)}>
          {c.url && (
            <p className="text-sm">
              <ExternalLink href={c.url} />
            </p>
          )}
        </EntrySummary>
      ))}
    </ul>
  );
}
