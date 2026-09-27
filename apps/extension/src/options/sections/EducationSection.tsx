import type { EducationEntry } from '@jobfill/types';
import { createEducationEntry, formatDateRange } from '@jobfill/shared';
import { EntryList } from '@/components/ui/EntryList';
import { TextAreaField, TextField } from '@/components/ui/Field';
import type { SectionFormProps } from './types';
import { Clamp, EntrySummary, NotProvided } from './summary-ui';

const degreeLine = (e: EducationEntry) => [e.degree, e.fieldOfStudy].filter(Boolean).join(', ');

export function EducationForm({ value, onChange, errors }: SectionFormProps<'education'>) {
  return (
    <EntryList
      items={value}
      onChange={onChange}
      create={createEducationEntry}
      errors={errors}
      addLabel="Add education"
      emptyText="No education added yet. Add your most recent degree first."
      itemTitle={(e, i) => e.institution || degreeLine(e) || `Education ${i + 1}`}
      itemSubtitle={(e) =>
        [degreeLine(e), formatDateRange(e.startDate, e.endDate)].filter(Boolean).join(' · ')
      }
      renderItem={(e, update, err) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Institution"
            required
            className="sm:col-span-2"
            value={e.institution}
            onChange={(v) => update({ institution: v })}
            error={err.institution}
          />
          <TextField
            label="Degree"
            placeholder="e.g. B.Sc., MBA"
            value={e.degree}
            onChange={(v) => update({ degree: v })}
            error={err.degree}
          />
          <TextField
            label="Field of study"
            placeholder="e.g. Computer Science"
            value={e.fieldOfStudy}
            onChange={(v) => update({ fieldOfStudy: v })}
            error={err.fieldOfStudy}
          />
          <TextField
            label="Location"
            value={e.location}
            onChange={(v) => update({ location: v })}
            error={err.location}
          />
          <TextField
            label="GPA / CGPA"
            placeholder="e.g. 3.8/4.0"
            value={e.gpa}
            onChange={(v) => update({ gpa: v })}
            error={err.gpa}
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
            hint="Or expected graduation."
            value={e.endDate}
            onChange={(v) => update({ endDate: v })}
            error={err.endDate}
          />
          <TextAreaField
            label="Description"
            rows={3}
            className="sm:col-span-2"
            placeholder="Honours, thesis, relevant coursework…"
            value={e.description}
            onChange={(v) => update({ description: v })}
            error={err.description}
          />
        </div>
      )}
    />
  );
}

export function EducationSummary({ value }: { value: EducationEntry[] }) {
  if (value.length === 0) return <NotProvided />;
  return (
    <ul className="space-y-4">
      {value.map((e) => (
        <EntrySummary
          key={e.id}
          title={e.institution}
          subtitle={[degreeLine(e), e.location, e.gpa && `GPA ${e.gpa}`]
            .filter(Boolean)
            .join(' · ')}
          meta={formatDateRange(e.startDate, e.endDate)}
        >
          {e.description && <Clamp text={e.description} />}
        </EntrySummary>
      ))}
    </ul>
  );
}
