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
  // The post-import "details" step sits just before Review.
  const currentIndex = FORM_STEPS.indexOf(current === 'details' ? 'review' : current);
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
                  isCurrent ? 'bg-accent-soft font-semibold text-accent' : 'text-muted',
                  canJump && !isCurrent && 'hover:bg-subtle-2',
                )}
              >
                <span
                  className={cx(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isCurrent && 'bg-brand-600 text-white',
                    isDone && 'bg-ok-soft text-ok',
                    !isCurrent && !isDone && 'border border-line-strong bg-surface text-muted',
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
      <div className="rounded-xl border border-line bg-surface p-4">
        <CompletenessBar percent={completeness.percent} compact />
      </div>
    </nav>
  );
}
