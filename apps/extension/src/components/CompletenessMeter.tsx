import type { Completeness, CompletenessArea } from '@jobfill/shared';
import { cx } from '@/utils/cx';
import { CheckIcon } from './ui/icons';

function barColor(percent: number) {
  // Calm colours: incomplete is a nudge, not an alarm.
  if (percent >= 80) return 'bg-emerald-500';
  return 'bg-brand-500';
}

export function CompletenessBar({
  percent,
  compact = false,
}: {
  percent: number;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className={cx('font-medium text-body', compact ? 'text-xs' : 'text-sm')}>
          Profile completeness
        </span>
        <span className={cx('font-semibold text-fg tabular-nums', compact ? 'text-xs' : 'text-sm')}>
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cx('overflow-hidden rounded-full bg-subtle-2', compact ? 'h-1.5' : 'h-2.5')}
      >
        <div
          className={cx(
            'h-full origin-left animate-grow rounded-full transition-[width] duration-500',
            barColor(percent),
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Bar plus the core checklist, then the optional details (address, DOB, gender,
 * preferences…) as a separate, non-blocking list. Clicking an item calls onSelect.
 */
export function CompletenessMeter({
  completeness,
  onSelect,
}: {
  completeness: Completeness;
  onSelect?: (area: CompletenessArea, group?: string) => void;
}) {
  const notProvided = completeness.optional.filter((o) => !o.provided);
  return (
    <div>
      <CompletenessBar percent={completeness.percent} />
      <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
        Core profile{' '}
        {completeness.coreComplete && <span className="text-ok normal-case">✓ Complete</span>}
      </p>
      <ul className="mt-1 space-y-1">
        {completeness.items.map((item) => {
          const done = item.score === 1;
          const content = (
            <>
              <span
                className={cx(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  done ? 'bg-ok-soft text-ok' : 'border border-line-strong bg-surface',
                )}
              >
                {done && <CheckIcon className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx('block', done ? 'text-muted' : 'font-medium text-fg')}>
                  {item.label}
                </span>
                {!done && item.missing.length > 0 && (
                  <span className="block truncate text-xs text-muted">
                    Add: {item.missing.join(', ')}
                  </span>
                )}
              </span>
            </>
          );
          return (
            <li key={item.id}>
              {onSelect && !done ? (
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-subtle"
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-start gap-2.5 px-2 py-1.5 text-sm">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      {completeness.optional.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Additional information
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {notProvided.length === 0
              ? 'All provided.'
              : `${notProvided.length} optional ${notProvided.length === 1 ? 'detail' : 'details'} not provided — fill them only if you want them answered for you.`}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {completeness.optional.map((o) => {
              const text = (
                <>
                  <span className={o.provided ? 'text-ok' : 'text-faint'}>
                    {o.provided ? '✓' : '○'}
                  </span>
                  <span className={o.provided ? 'text-muted' : 'text-body'}>{o.label}</span>
                </>
              );
              return (
                <li key={o.label}>
                  {onSelect && !o.provided ? (
                    <button
                      type="button"
                      onClick={() => onSelect(o.id, o.group)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-subtle"
                    >
                      {text}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1 text-xs">{text}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
