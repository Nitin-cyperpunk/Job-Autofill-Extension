import type { ProfessionalInfo } from '@jobfill/types';
import { CheckboxField, TextAreaField, TextField } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import type { SectionFormProps } from './types';
import { Clamp, DetailList, TagList } from './summary-ui';

const WORK_AUTH_SUGGESTIONS = [
  'Citizen',
  'Permanent resident',
  'Work visa',
  'Student visa (work permitted)',
  'Requires work authorization',
];

export function ProfessionalForm({ value, onChange, errors }: SectionFormProps<'professional'>) {
  const set =
    <F extends keyof ProfessionalInfo>(field: F) =>
    (v: ProfessionalInfo[F]) =>
      onChange({ ...value, [field]: v });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Current job title"
        autoComplete="organization-title"
        value={value.currentTitle}
        onChange={set('currentTitle')}
        error={errors.currentTitle}
      />
      <TextField
        label="Current company"
        autoComplete="organization"
        value={value.currentCompany}
        onChange={set('currentCompany')}
        error={errors.currentCompany}
      />
      <TextField
        label="Years of experience"
        inputMode="decimal"
        placeholder="e.g. 5"
        value={value.yearsOfExperience}
        onChange={set('yearsOfExperience')}
        error={errors.yearsOfExperience}
      />
      <TextField
        label="Notice period"
        placeholder="e.g. 30 days, Immediate"
        value={value.noticePeriod}
        onChange={set('noticePeriod')}
        error={errors.noticePeriod}
      />
      <TextField
        label="Expected salary"
        placeholder="e.g. USD 120,000 / year"
        hint="Include the currency and period."
        value={value.expectedSalary}
        onChange={set('expectedSalary')}
        error={errors.expectedSalary}
      />
      <TextField
        label="Work authorization"
        list="jobfill-work-auth"
        placeholder="e.g. Citizen, H-1B, Work permit"
        value={value.workAuthorization}
        onChange={set('workAuthorization')}
        error={errors.workAuthorization}
      />
      <datalist id="jobfill-work-auth">
        {WORK_AUTH_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <TagInput
        label="Preferred locations"
        placeholder="e.g. Remote, Berlin, New York"
        className="sm:col-span-2"
        value={value.preferredLocations}
        onChange={set('preferredLocations')}
        error={errors.preferredLocations}
      />
      <TextAreaField
        label="Professional summary"
        rows={5}
        className="sm:col-span-2"
        hint="2–4 sentences about what you do and what you’re looking for."
        value={value.summary}
        onChange={set('summary')}
        error={errors.summary}
      />
      <div className="flex flex-col gap-3 sm:col-span-2">
        <CheckboxField
          label="Willing to relocate"
          checked={value.willingToRelocate}
          onChange={set('willingToRelocate')}
        />
        <CheckboxField
          label="Requires visa sponsorship"
          description="Many applications ask this — answering once saves time."
          checked={value.requiresSponsorship}
          onChange={set('requiresSponsorship')}
        />
      </div>
    </div>
  );
}

export function ProfessionalSummary({ value }: { value: ProfessionalInfo }) {
  return (
    <div className="space-y-4">
      <DetailList
        rows={[
          ['Current role', [value.currentTitle, value.currentCompany].filter(Boolean).join(' at ')],
          ['Experience', value.yearsOfExperience && `${value.yearsOfExperience} years`],
          ['Notice period', value.noticePeriod],
          ['Expected salary', value.expectedSalary],
          ['Work authorization', value.workAuthorization],
          ['Relocation', value.willingToRelocate ? 'Willing to relocate' : ''],
          ['Sponsorship', value.requiresSponsorship ? 'Requires sponsorship' : ''],
          [
            'Preferred locations',
            value.preferredLocations.length > 0 && <TagList tags={value.preferredLocations} />,
          ],
        ]}
      />
      {value.summary && <Clamp text={value.summary} />}
    </div>
  );
}
