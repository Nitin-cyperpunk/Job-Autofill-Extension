import type { AdditionalInfo } from '@jobfill/types';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { answerLabel } from './answer';
import { AnswerField, FormGroup, Suggestions } from './form-ui';
import type { SectionFormProps } from './types';
import { Clamp, DetailList } from './summary-ui';

const DECLINE = 'Prefer not to say';

/**
 * Answers JobFill must never infer: equal-opportunity (EEO) questions and background /
 * compliance questions. Each is used only exactly as the user enters it; anything left
 * blank stays for the user to answer on the form.
 */
export function AdditionalForm({ value, onChange, errors }: SectionFormProps<'additional'>) {
  const set =
    <F extends keyof AdditionalInfo>(field: F) =>
    (v: AdditionalInfo[F]) =>
      onChange({ ...value, [field]: v });

  return (
    <div className="space-y-6">
      <FormGroup
        title="Equal-opportunity questions"
        description="Many applications ask these (often optionally). Fill them only if you want JobFill to answer — exactly as written here. Blank = you answer on each form."
      >
        <TextField
          label="Disability"
          list="jobfill-decline"
          placeholder="e.g. No, Yes, Prefer not to say"
          value={value.disability}
          onChange={set('disability')}
          error={errors.disability}
        />
        <TextField
          label="Veteran status"
          list="jobfill-decline"
          placeholder="e.g. I am not a protected veteran"
          value={value.veteranStatus}
          onChange={set('veteranStatus')}
          error={errors.veteranStatus}
        />
        <TextField
          label="Race / ethnicity"
          list="jobfill-decline"
          placeholder={DECLINE}
          value={value.ethnicity}
          onChange={set('ethnicity')}
          error={errors.ethnicity}
        />
        <Suggestions id="jobfill-decline" values={[DECLINE, 'No', 'Yes']} />
      </FormGroup>

      <FormGroup
        title="Background & compliance"
        description="Yes/No questions. Agreements and consent boxes are never ticked for you, whatever you set here."
      >
        <AnswerField
          label="Willing to undergo a background check?"
          value={value.backgroundCheck}
          onChange={set('backgroundCheck')}
          error={errors.backgroundCheck}
        />
        <AnswerField
          label="Willing to take a drug test?"
          value={value.drugTest}
          onChange={set('drugTest')}
          error={errors.drugTest}
        />
        <AnswerField
          label="Have you ever been convicted of a crime?"
          value={value.criminalRecord}
          onChange={set('criminalRecord')}
          error={errors.criminalRecord}
        />
      </FormGroup>

      <FormGroup title="Other common questions">
        <TextField
          label="How did you hear about us? (default answer)"
          placeholder="e.g. LinkedIn"
          value={value.referralSource}
          onChange={set('referralSource')}
          error={errors.referralSource}
        />
        <TextAreaField
          label="Default cover letter"
          rows={6}
          className="sm:col-span-2"
          hint="Filled into cover-letter text boxes and flagged for you to tailor. Upload fields still need your file."
          value={value.coverLetter}
          onChange={set('coverLetter')}
          error={errors.coverLetter}
        />
      </FormGroup>
    </div>
  );
}

export function AdditionalSummary({ value }: { value: AdditionalInfo }) {
  return (
    <div className="space-y-4">
      <DetailList
        rows={[
          ['Disability', value.disability],
          ['Veteran status', value.veteranStatus],
          ['Race / ethnicity', value.ethnicity],
          ['Background check', answerLabel(value.backgroundCheck)],
          ['Drug test', answerLabel(value.drugTest)],
          ['Criminal record', answerLabel(value.criminalRecord)],
          ['How you heard about roles', value.referralSource],
        ]}
      />
      {value.coverLetter && <Clamp text={value.coverLetter} />}
    </div>
  );
}
