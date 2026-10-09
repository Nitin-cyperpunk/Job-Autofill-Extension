import { EMPLOYMENT_TYPES, type ExperienceEntry } from '@jobfill/types';
import { EMPLOYMENT_TYPE_LABELS, createExperienceEntry, formatDateRange } from '@jobfill/shared';
import { EntryList } from '@/components/ui/EntryList';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import type { SectionFormProps } from './types';
import { Clamp, EntrySummary, NotProvided, TagList } from './summary-ui';

const EMPLOYMENT_OPTIONS = EMPLOYMENT_TYPES.map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABELS[value],
}));

const range = (e: ExperienceEntry) => formatDateRange(e.startDate, e.endDate, e.isCurrent);

export function ExperienceForm({ value, onChange, errors }: SectionFormProps<'experience'>) {
  return (
    <EntryList
      items={value}
      onChange={onChange}
      create={createExperienceEntry}
      errors={errors}
      addLabel="Add experience"
      emptyText="No experience added yet. Start with your current or most recent role."
      itemTitle={(e, i) => [e.jobTitle, e.company].filter(Boolean).join(' · ') || `Role ${i + 1}`}
      itemSubtitle={range}
      renderItem={(e, update, err) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Job title"
            required
            value={e.jobTitle}
            onChange={(v) => update({ jobTitle: v })}
            error={err.jobTitle}
          />
          <TextField
            label="Company"
            required
            value={e.company}
            onChange={(v) => update({ company: v })}
            error={err.company}
          />
          <SelectField
            label="Employment type"
            options={EMPLOYMENT_OPTIONS}
            value={e.employmentType}
            onChange={(v) => update({ employmentType: v })}
            error={err.employmentType}
          />
          <TextField
            label="Location"
            placeholder="e.g. Remote, London"
            value={e.location}
            onChange={(v) => update({ location: v })}
            error={err.location}
          />
          <TextField
            label="Start date"
            type="month"
            value={e.startDate}
            onChange={(v) => update({ startDate: v })}
            error={err.startDate}
          />
          <TextField
            label="End date"
            type="month"
            disabled={e.isCurrent}
            value={e.isCurrent ? '' : e.endDate}
            onChange={(v) => update({ endDate: v })}
            error={err.endDate}
          />
          <div className="sm:col-span-2">
            <CheckboxField
              label="I currently work here"
              checked={e.isCurrent}
              onChange={(v) => update({ isCurrent: v })}
            />
          </div>
          <TextAreaField
            label="Description"
            rows={4}
            className="sm:col-span-2"
            placeholder="What you owned, shipped or improved…"
            value={e.description}
            onChange={(v) => update({ description: v })}
            error={err.description}
          />
          <TagInput
            label="Skills used"
            className="sm:col-span-2"
            placeholder="e.g. React, Negotiation"
            value={e.skills}
            onChange={(v) => update({ skills: v })}
            error={err.skills}
          />
          <TextAreaField
            label="Reason for leaving (optional)"
            rows={2}
            className="sm:col-span-2"
            hint="Used only for “Why are you leaving?” questions, exactly as written."
            value={e.reasonForLeaving}
            onChange={(v) => update({ reasonForLeaving: v })}
            error={err.reasonForLeaving}
          />
        </div>
      )}
    />
  );
}

export function ExperienceSummary({ value }: { value: ExperienceEntry[] }) {
  if (value.length === 0)
    return (
      <NotProvided>
        No experience added yet. Add your roles once — JobFill fills them into every work-history
        section.
      </NotProvided>
    );
  return (
    <ul className="space-y-4">
      {value.map((e) => (
        <EntrySummary
          key={e.id}
          title={e.jobTitle}
          subtitle={[
            e.company,
            e.employmentType && EMPLOYMENT_TYPE_LABELS[e.employmentType],
            e.location,
          ]
            .filter(Boolean)
            .join(' · ')}
          meta={range(e)}
        >
          {e.description && <Clamp text={e.description} />}
          {e.skills.length > 0 && <TagList tags={e.skills} />}
        </EntrySummary>
      ))}
    </ul>
  );
}
