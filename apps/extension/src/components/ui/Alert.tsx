import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { AlertCircleIcon, CheckIcon } from './icons';

const tones = {
  error: 'border-danger-line bg-danger-soft text-danger',
  success: 'border-ok-line bg-ok-soft text-ok',
  info: 'border-accent-line bg-accent-soft text-accent',
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
