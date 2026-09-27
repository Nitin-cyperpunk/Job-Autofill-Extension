import { LockIcon, ShieldCheckIcon } from './ui/icons';
import { cx } from '@/utils/cx';

export const PRIVACY_MESSAGE = 'Your profile is stored locally on this device.';

/**
 * The one privacy message users see everywhere. "badge" is for headers,
 * "banner" explains it in a sentence more. Keep both true for every configuration —
 * including AI turned on — and never claim more than the code guarantees.
 * The banner is only used on the options page (its link is an options-page route).
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
          'inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-medium text-ok ring-1 ring-ok-line',
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
        'flex items-start gap-3 rounded-xl border border-ok-line bg-ok-soft px-4 py-3 text-sm text-ok',
        className,
      )}
    >
      <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
      <p>
        <strong className="font-semibold">{PRIVACY_MESSAGE}</strong> JobFill has no accounts and no
        servers of its own. Nothing you enter is uploaded — unless you turn on optional AI answers,
        and then only the details you approve for each answer go to the AI provider you chose.{' '}
        <a href="#/privacy" className="font-medium underline underline-offset-2">
          Privacy settings
        </a>
      </p>
    </div>
  );
}
