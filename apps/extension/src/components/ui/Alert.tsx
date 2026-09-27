import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { AlertCircleIcon, CheckIcon } from './icons';

const tones = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-brand-100 bg-brand-50 text-brand-700',
};

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        tones[tone],
        className,
      )}
    >
      {tone === 'success' ? (
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
