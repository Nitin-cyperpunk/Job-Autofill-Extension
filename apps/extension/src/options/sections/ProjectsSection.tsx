import type { ProjectEntry } from '@jobfill/types';
import { createProjectEntry } from '@jobfill/shared';
import { EntryList } from '@/components/ui/EntryList';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import type { SectionFormProps } from './types';
import { Clamp, EntrySummary, ExternalLink, NotProvided, TagList } from './summary-ui';

export function ProjectsForm({ value, onChange, errors }: SectionFormProps<'projects'>) {
  return (
    <EntryList
      items={value}
      onChange={onChange}
      create={createProjectEntry}
      errors={errors}
      addLabel="Add project"
      emptyText="No projects added yet. Side projects and open source count."
      itemTitle={(p, i) => p.name || `Project ${i + 1}`}
      itemSubtitle={(p) => [p.role, p.technologies.join(', ')].filter(Boolean).join(' · ')}
      renderItem={(p, update, err) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Project name"
            required
            className="sm:col-span-2"
            value={p.name}
            onChange={(v) => update({ name: v })}
            error={err.name}
          />
          <TextField
            label="Your role"
            placeholder="e.g. Lead developer"
            value={p.role}
            onChange={(v) => update({ role: v })}
            error={err.role}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Start"
              type="month"
              value={p.startDate}
              onChange={(v) => update({ startDate: v })}
              error={err.startDate}
            />
            <TextField
              label="End"
              type="month"
              value={p.endDate}
              onChange={(v) => update({ endDate: v })}
              error={err.endDate}
            />
          </div>
          <TextField
            label="Live / demo URL"
            type="url"
            placeholder="https://"
            value={p.url}
            onChange={(v) => update({ url: v })}
            error={err.url}
          />
          <TextField
            label="Repository URL"
            type="url"
            placeholder="https://github.com/…"
            value={p.githubUrl}
            onChange={(v) => update({ githubUrl: v })}
            error={err.githubUrl}
          />
          <TagInput
            label="Technologies"
            className="sm:col-span-2"
            placeholder="e.g. TypeScript, PostgreSQL"
            value={p.technologies}
            onChange={(v) => update({ technologies: v })}
            error={err.technologies}
          />
          <TextAreaField
            label="Description"
            rows={3}
            className="sm:col-span-2"
            hint="What it does and what you built. Used for “Describe a project…” questions — JobFill picks the project that matches the question."
            value={p.description}
            onChange={(v) => update({ description: v })}
            error={err.description}
          />
          <TextAreaField
            label="Outcome / achievement (optional)"
            rows={2}
            className="sm:col-span-2"
            placeholder="e.g. Used by 3 student societies"
            value={p.outcome}
            onChange={(v) => update({ outcome: v })}
            error={err.outcome}
          />
        </div>
      )}
    />
  );
}

export function ProjectsSummary({ value }: { value: ProjectEntry[] }) {
  if (value.length === 0)
    return (
      <NotProvided>
        No projects added yet. Add them once and JobFill can reuse them across applications.
      </NotProvided>
    );
  return (
    <ul className="space-y-4">
      {value.map((p) => (
        <EntrySummary key={p.id} title={p.name} subtitle={p.role}>
          {p.description && <Clamp text={p.description} />}
          {p.outcome && <p className="text-sm text-body">{p.outcome}</p>}
          {p.technologies.length > 0 && <TagList tags={p.technologies} />}
          {(p.url || p.githubUrl) && (
            <p className="flex flex-wrap gap-x-4 text-sm">
              {p.url && <ExternalLink href={p.url} />}
              {p.githubUrl && <ExternalLink href={p.githubUrl} />}
            </p>
          )}
        </EntrySummary>
      ))}
    </ul>
  );
}
