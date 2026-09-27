import { cx } from '@/utils/cx';

/** Shared look for text inputs, selects and textareas. */
export const controlClass = (invalid?: boolean) =>
  cx(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:ring-2 focus:outline-none disabled:bg-slate-50',
    invalid
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
  );
