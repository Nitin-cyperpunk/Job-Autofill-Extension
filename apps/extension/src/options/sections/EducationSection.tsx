import type { EducationEntry } from '@jobfill/types';
import { createEducationEntry, formatDateRange } from '@jobfill/shared';
import { EntryList } from '@/components/ui/EntryList';
import { CheckboxField, TextAreaField, TextField } from '@/components/ui/Field';
import { Suggestions } from './form-ui';
import type { SectionFormProps } from './types';
import { Clamp, EntrySummary, NotProvided } from './summary-ui';

const degreeLine = (e: EducationEntry) => [e.degree, e.fieldOfStudy].filter(Boolean).join(', ');

const LEVELS = [
  'Doctorate (PhD)',
  "Master's",
  "Bachelor's",
  'Diploma',
  '12th (Higher Secondary)',
  '10th (Secondary)',
  'Associate',
  'Certificate',
];

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
            label="Level"
            list="jobfill-edu-levels"
            placeholder="e.g. Bachelor's, 12th"
            value={e.level}
            onChange={(v) => update({ level: v })}
            error={err.level}
          />
          <Suggestions id="jobfill-edu-levels" values={LEVELS} />
          <TextField
            label="Degree / course"
            placeholder="e.g. B.Tech, MBA, Class XII"
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
            label="CGPA / GPA / Percentage"
            placeholder="e.g. 8.6/10 or 86%"
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
            label={e.isCurrent ? 'Expected graduation' : 'End date'}
            type="month"
            value={e.endDate}
            onChange={(v) => update({ endDate: v })}
            error={err.endDate}
          />
          <div className="sm:col-span-2">
            <CheckboxField
              label="I’m currently studying here"
              checked={e.isCurrent}
              onChange={(v) => update({ isCurrent: v })}
            />
          </div>
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
  if (value.length === 0)
    return (
      <NotProvided>
        No education added yet. Add your degrees once and JobFill fills them in order.
      </NotProvided>
    );
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
