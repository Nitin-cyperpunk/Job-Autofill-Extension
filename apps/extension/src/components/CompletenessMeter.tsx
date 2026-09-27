import type { Completeness, CompletenessArea } from '@jobfill/shared';
import { cx } from '@/utils/cx';
import { CheckIcon } from './ui/icons';

function barColor(percent: number) {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 40) return 'bg-brand-500';
  return 'bg-amber-500';
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
        <span className={cx('font-medium text-slate-700', compact ? 'text-xs' : 'text-sm')}>
          Profile completeness
        </span>
        <span
          className={cx(
            'font-semibold text-slate-900 tabular-nums',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cx('overflow-hidden rounded-full bg-slate-100', compact ? 'h-1.5' : 'h-2.5')}
      >
        <div
          className={cx('h-full rounded-full transition-[width] duration-500', barColor(percent))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Bar plus a per-area checklist. Clicking an incomplete area calls onSelect. */
export function CompletenessMeter({
  completeness,
  onSelect,
}: {
  completeness: Completeness;
  onSelect?: (area: CompletenessArea) => void;
}) {
  return (
    <div>
      <CompletenessBar percent={completeness.percent} />
      <ul className="mt-4 space-y-1">
        {completeness.items.map((item) => {
          const done = item.score === 1;
          const content = (
            <>
              <span
                className={cx(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  done ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-300 bg-white',
                )}
              >
                {done && <CheckIcon className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cx('block', done ? 'text-slate-500' : 'font-medium text-slate-800')}
                >
                  {item.label}
                </span>
                {!done && item.missing.length > 0 && (
                  <span className="block truncate text-xs text-slate-500">
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
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
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
    </div>
  );
}
