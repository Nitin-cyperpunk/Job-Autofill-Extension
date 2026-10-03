import { EMPLOYMENT_TYPES, type EmploymentType, type ProfessionalInfo } from '@jobfill/types';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { TagInput } from '@/components/ui/TagInput';
import { answerLabel } from './answer';
import { AnswerField, FormGroup, Suggestions } from './form-ui';
import { groupVisible } from './groups';
import type { SectionFormProps, SectionSummaryProps } from './types';
import { Clamp, StatusList, TagList, type StatusRow } from './summary-ui';

const WORK_AUTH_SUGGESTIONS = [
  'Citizen',
  'Permanent resident',
  'Work visa',
  'Student visa (work permitted)',
  'Requires work authorization',
];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'AED'];

const WORK_MODES: ReadonlyArray<{
  value: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  label: string;
}> = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible / no preference' },
];

const JOB_TYPE_LABELS: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
  temporary: 'Temporary',
  apprenticeship: 'Apprenticeship',
};

export function ProfessionalForm({
  value,
  onChange,
  errors,
  groups,
}: SectionFormProps<'professional'>) {
  const show = (group: string) => groupVisible(groups, group);
  const set =
    <F extends keyof ProfessionalInfo>(field: F) =>
    (v: ProfessionalInfo[F]) =>
      onChange({ ...value, [field]: v });
  const toggleJobType = (type: EmploymentType, on: boolean) =>
    onChange({
      ...value,
      preferredJobTypes: on
        ? [...value.preferredJobTypes.filter((t) => t !== type), type]
        : value.preferredJobTypes.filter((t) => t !== type),
    });

  return (
    <div className="space-y-6">
      {show('role') && (
      <FormGroup title="Current role">
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
        <TextAreaField
          label="Professional summary"
          rows={4}
          className="sm:col-span-2"
          hint="2–4 sentences about what you do and what you’re looking for. Used for “Tell us about yourself”."
          value={value.summary}
          onChange={set('summary')}
          error={errors.summary}
        />
      </FormGroup>
      )}

      {show('compensation') && (
      <FormGroup
        title="Compensation"
        description="Optional. Write salaries the way you’d put them on a form, e.g. “12 LPA” or “USD 120,000 / year”."
      >
        <TextField
          label="Current salary / CTC"
          placeholder="e.g. 12 LPA"
          value={value.currentSalary}
          onChange={set('currentSalary')}
          error={errors.currentSalary}
        />
        <TextField
          label="Expected salary / CTC"
          placeholder="e.g. 18 LPA"
          value={value.expectedSalary}
          onChange={set('expectedSalary')}
          error={errors.expectedSalary}
        />
        <TextField
          label="Salary currency"
          list="jobfill-currencies"
          placeholder="e.g. INR"
          maxLength={3}
          value={value.salaryCurrency}
          onChange={(v) => set('salaryCurrency')(v.toUpperCase())}
          error={errors.salaryCurrency}
        />
        <Suggestions id="jobfill-currencies" values={CURRENCIES} />
      </FormGroup>
      )}

      {show('availability') && (
      <FormGroup
        title="Availability"
        description="Optional. Used for notice-period and start-date questions."
      >
        <TextField
          label="Notice period"
          placeholder="e.g. 30 days, Immediate"
          value={value.noticePeriod}
          onChange={set('noticePeriod')}
          error={errors.noticePeriod}
        />
        <TextField
          label="Earliest start date"
          type="date"
          value={value.earliestStartDate}
          onChange={set('earliestStartDate')}
          error={errors.earliestStartDate}
        />
      </FormGroup>
      )}

      {show('preferences') && (
      <FormGroup title="Job preferences" description="Optional — skip anything you’d rather answer per job.">
        <TagInput
          label="Preferred locations"
          placeholder="e.g. Remote, Bengaluru, Berlin"
          className="sm:col-span-2"
          value={value.preferredLocations}
          onChange={set('preferredLocations')}
          error={errors.preferredLocations}
        />
        <SelectField
          label="Preferred work mode"
          placeholder="No answer"
          value={value.preferredWorkMode}
          onChange={set('preferredWorkMode')}
          options={WORK_MODES}
          error={errors.preferredWorkMode}
        />
        <AnswerField
          label="Willing to relocate?"
          value={value.willingToRelocate}
          onChange={set('willingToRelocate')}
          error={errors.willingToRelocate}
        />
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-body">Job types you’re open to</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EMPLOYMENT_TYPES.map((type) => (
              <CheckboxField
                key={type}
                label={JOB_TYPE_LABELS[type]}
                checked={value.preferredJobTypes.includes(type)}
                onChange={(on) => toggleJobType(type, on)}
              />
            ))}
          </div>
        </fieldset>
      </FormGroup>
      )}

      {show('authorization') && (
      <FormGroup
        title="Work authorization"
        description="JobFill only answers authorization and sponsorship questions from what you set here — never by guessing."
      >
        <TextField
          label="Work authorization status"
          list="jobfill-work-auth"
          placeholder="e.g. Citizen, H-1B, Work permit"
          value={value.workAuthorization}
          onChange={set('workAuthorization')}
          error={errors.workAuthorization}
        />
        <Suggestions id="jobfill-work-auth" values={WORK_AUTH_SUGGESTIONS} />
        <AnswerField
          label="Require visa sponsorship?"
          hint="“Will you now or in the future require sponsorship?”"
          value={value.requiresSponsorship}
          onChange={set('requiresSponsorship')}
          error={errors.requiresSponsorship}
        />
        <TagInput
          label="Countries you’re authorized to work in"
          placeholder="e.g. India"
          className="sm:col-span-2"
          hint="Used for “Are you legally authorized to work in …?”. A country that isn’t listed is left for you to answer."
          value={value.authorizedCountries}
          onChange={set('authorizedCountries')}
          error={errors.authorizedCountries}
        />
      </FormGroup>
      )}
    </div>
  );
}

export function ProfessionalSummary({ value, groups }: SectionSummaryProps<'professional'>) {
  const workMode = WORK_MODES.find((m) => m.value === value.preferredWorkMode)?.label ?? '';
  const rows: Record<string, StatusRow[]> = {
    role: [
      {
        label: 'Current role',
        value: [value.currentTitle, value.currentCompany].filter(Boolean).join(' at '),
        path: 'professional.currentTitle',
      },
      {
        label: 'Experience',
        value: value.yearsOfExperience && `${value.yearsOfExperience} years`,
        path: 'professional.yearsOfExperience',
      },
    ],
    compensation: [
      { label: 'Current salary', value: value.currentSalary },
      {
        label: 'Expected salary',
        value: [value.expectedSalary, value.salaryCurrency && `(${value.salaryCurrency})`]
          .filter(Boolean)
          .join(' '),
      },
    ],
    availability: [
      { label: 'Notice period', value: value.noticePeriod },
      { label: 'Earliest start', value: value.earliestStartDate },
    ],
    preferences: [
      {
        label: 'Preferred locations',
        value: value.preferredLocations.length > 0 && <TagList tags={value.preferredLocations} />,
      },
      { label: 'Work mode', value: workMode },
      {
        label: 'Job types',
        value: value.preferredJobTypes.map((t) => JOB_TYPE_LABELS[t]).join(', '),
      },
      { label: 'Relocation', value: answerLabel(value.willingToRelocate) },
    ],
    authorization: [
      { label: 'Work authorization', value: value.workAuthorization },
      { label: 'Authorized in', value: value.authorizedCountries.join(', ') },
      { label: 'Needs sponsorship', value: answerLabel(value.requiresSponsorship) },
    ],
  };
  return (
    <div className="space-y-4">
      <StatusList
        rows={Object.entries(rows).flatMap(([group, list]) =>
          groupVisible(groups, group) ? list : [],
        )}
      />
      {groupVisible(groups, 'role') && value.summary && <Clamp text={value.summary} />}
    </div>
  );
}
