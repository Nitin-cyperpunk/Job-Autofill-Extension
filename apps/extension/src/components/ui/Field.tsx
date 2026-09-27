import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '@/utils/cx';
import { controlClass } from './control-class';

/** Props a control needs so its label, hint and error are announced correctly. */
export interface ControlProps {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
  'aria-required': boolean | undefined;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-body">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
        'aria-required': required || undefined,
      })}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Common = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  ...input
}: Common &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
    value: string;
    onChange: (value: string) => void;
  }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(control) => (
        <input
          {...control}
          {...input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={controlClass(Boolean(error))}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  rows = 4,
  ...textarea
}: Common &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
    value: string;
    onChange: (value: string) => void;
  }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(control) => (
        <textarea
          {...control}
          {...textarea}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(controlClass(Boolean(error)), 'resize-y')}
        />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  ...select
}: Common &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
    value: T | '';
    onChange: (value: T | '') => void;
    options: ReadonlyArray<{ value: T; label: string }>;
    placeholder?: string;
  }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(control) => (
        <select
          {...control}
          {...select}
          value={value}
          onChange={(e) => onChange(e.target.value as T | '')}
          className={controlClass(Boolean(error))}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-line-strong accent-brand-600"
      />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium text-body">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
    </div>
  );
}
