import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cleanTags } from '@jobfill/shared';
import { cx } from '@/utils/cx';
import { Field } from './Field';
import { XIcon } from './icons';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Chips input: Enter or comma adds, Backspace on an empty input removes the last
 * chip, and pasting "a, b, c" adds all three. Duplicates are ignored.
 */
export function TagInput({
  label,
  value,
  onChange,
  hint = 'Press Enter or comma to add.',
  error,
  placeholder,
  className,
}: TagInputProps) {
  const [text, setText] = useState('');

  function add(raw: string) {
    const parts = raw.split(/[,\n]/);
    const next = cleanTags([...value, ...parts]);
    if (next.length !== value.length) onChange(next);
    setText('');
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (text.trim()) add(text);
    } else if (e.key === 'Backspace' && !text && value.length) {
      remove(value.length - 1);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    if (/[,\n]/.test(pasted)) {
      e.preventDefault();
      add(text + pasted);
    }
  }

  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(control) => (
        <div
          className={cx(
            'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-sm focus-within:ring-2',
            error
              ? 'border-red-400 focus-within:ring-red-100'
              : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-100',
          )}
        >
          {value.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 rounded-md bg-brand-50 py-0.5 pr-1 pl-2 text-xs font-medium text-brand-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-0.5 hover:bg-brand-100"
                aria-label={`Remove ${tag}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            {...control}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => text.trim() && add(text)}
            placeholder={value.length ? '' : placeholder}
            className="min-w-32 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      )}
    </Field>
  );
}
