import { cx } from '@/utils/cx';

/** Shared look for text inputs, selects and textareas. */
export const controlClass = (invalid?: boolean) =>
  cx(
    'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg shadow-card transition-colors placeholder:text-faint focus:ring-2 focus:outline-none disabled:bg-subtle',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger-line'
      : 'border-line-strong focus:border-accent focus:ring-accent-line',
  );
