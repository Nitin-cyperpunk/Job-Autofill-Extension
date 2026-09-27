import { CompletenessBar } from '@/components/CompletenessMeter';
import { CheckIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { cx } from '@/utils/cx';
import type { StepId } from '../router';
import { FORM_STEPS, STEP_LABELS } from './steps';

export function StepSidebar({
  current,
  onSelect,
}: {
  current: StepId;
  onSelect: (step: StepId) => void;
}) {
  const { profile, completeness } = useProfile();
  const currentIndex = FORM_STEPS.indexOf(current);
  // Free navigation once the required personal step has been saved.
  const canJump = profile.createdAt !== null;

  return (
    <nav aria-label="Setup progress" className="space-y-6">
      <ol className="space-y-1">
        {FORM_STEPS.map((step, i) => {
          const isCurrent = step === current;
          // Skipped steps with nothing in them keep their number instead of a tick.
          const area = completeness.items.find((item) => item.id === step);
          const isDone = i < currentIndex && (area ? area.score > 0 : true);
          return (
            <li key={step}>
              <button
                type="button"
                disabled={!canJump || isCurrent}
                onClick={() => onSelect(step)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  isCurrent ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600',
                  canJump && !isCurrent && 'hover:bg-slate-100',
                )}
              >
                <span
                  className={cx(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isCurrent && 'bg-brand-600 text-white',
                    isDone && 'bg-emerald-100 text-emerald-700',
                    !isCurrent && !isDone && 'border border-slate-300 bg-white text-slate-500',
                  )}
                >
                  {isDone ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {STEP_LABELS[step]}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <CompletenessBar percent={completeness.percent} compact />
      </div>
    </nav>
  );
}
