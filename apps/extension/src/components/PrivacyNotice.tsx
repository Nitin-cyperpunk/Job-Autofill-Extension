import { LockIcon, ShieldCheckIcon } from './ui/icons';
import { cx } from '@/utils/cx';

export const PRIVACY_MESSAGE = 'Your profile is stored locally on this device.';

/**
 * The one privacy message users see everywhere. "badge" is for headers,
 * "banner" explains it in a sentence more.
 */
export function PrivacyNotice({
  variant = 'banner',
  className,
}: {
  variant?: 'banner' | 'badge';
  className?: string;
}) {
  if (variant === 'badge') {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200',
          className,
        )}
      >
        <LockIcon className="h-3.5 w-3.5" />
        {PRIVACY_MESSAGE}
      </span>
    );
  }
  return (
    <div
      className={cx(
        'flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900',
        className,
      )}
    >
      <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p>
        <strong className="font-semibold">{PRIVACY_MESSAGE}</strong> JobFill has no servers and no
        accounts — nothing you enter here is uploaded anywhere.
      </p>
    </div>
  );
}
