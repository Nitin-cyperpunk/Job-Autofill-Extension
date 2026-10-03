import type { ReactNode } from 'react';
import type { Answer } from '@jobfill/types';
import { SelectField } from '@/components/ui/Field';
import { cx } from '@/utils/cx';

/** A titled group inside a section form, so long forms stay easy to scan. */
export function FormGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={cx('min-w-0 border-t border-line pt-5 first:border-t-0 first:pt-0', className)}
    >
      <legend className="sr-only">{title}</legend>
      <h3 className="text-sm font-semibold text-fg" aria-hidden="true">
        {title}
      </h3>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const ANSWER_OPTIONS: ReadonlyArray<{ value: 'yes' | 'no'; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/**
 * A yes/no answer that can also be "not answered". JobFill only fills a question from
 * an explicit Yes or No — "Not answered" leaves it for the user on the form.
 */
export function AnswerField({
  label,
  hint,
  value,
  onChange,
  error,
  className,
}: {
  label: string;
  hint?: string;
  value: Answer;
  onChange: (value: Answer) => void;
  error?: string;
  className?: string;
}) {
  return (
    <SelectField
      label={label}
      hint={hint}
      error={error}
      className={className}
      placeholder="Not answered — I’ll answer on each form"
      value={value}
      onChange={(v) => onChange(v)}
      options={ANSWER_OPTIONS}
    />
  );
}

/** Suggestion list for a free-text field (rendered once next to the input). */
export function Suggestions({ id, values }: { id: string; values: readonly string[] }) {
  return (
    <datalist id={id}>
      {values.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}
