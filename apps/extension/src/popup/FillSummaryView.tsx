import { useState } from 'react';
import type { FillResultItem, FillSummary } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { AlertCircleIcon, CheckIcon, PencilIcon } from '@/components/ui/icons';
import { attachResumeInFrame } from '@/utils/frames';

/** "Attach Resume" for a résumé field autofill couldn't attach. Success is re-checked in the page. */
function AttachResumeButton({ fieldId }: { fieldId: string }) {
  const [state, setState] = useState<
    { name: 'idle' } | { name: 'busy' } | { name: 'done' } | { name: 'error'; message: string }
  >({ name: 'idle' });
  if (state.name === 'done')
    return <span className="mt-1 block font-medium text-ok">✓ Resume attached</span>;
  return (
    <span className="mt-1 block">
      <button
        type="button"
        disabled={state.name === 'busy'}
        onClick={async () => {
          setState({ name: 'busy' });
          const res = await attachResumeInFrame(fieldId);
          setState(
            res.ok
              ? { name: 'done' }
              : { name: 'error', message: res.message ?? 'Couldn’t attach the resume.' },
          );
        }}
        className="rounded-md bg-surface px-2 py-1 font-medium text-warn ring-1 ring-warn-line hover:bg-warn-soft disabled:opacity-60"
      >
        {state.name === 'busy' ? 'Attaching…' : 'Attach Resume'}
      </button>
      {state.name === 'error' && <span className="mt-1 block text-danger">{state.message}</span>}
    </span>
  );
}

/**
 * JobFill filled 17 fields.
 * ✓ First Name …
 * ⚠ 2 fields require review
 */
export function FillSummaryView({
  summary,
  onDone,
  onAskAI,
}: {
  summary: FillSummary;
  onDone: () => void;
  /** Opens the (optional) AI assistant for one open question. */
  onAskAI: (item: FillResultItem) => void;
}) {
  const {
    filledCount,
    filled,
    review,
    skipped,
    revealed = 0,
    questions = [],
    outcomes = [],
  } = summary;
  // Every planned field when the run reports outcomes; otherwise the sum of the lists.
  const detected = outcomes.length || filled.length + review.length + skipped + questions.length;
  const resumePending = new Set(
    outcomes.filter((o) => o.resume && o.status !== 'filled').map((o) => o.fieldId),
  );
  return (
    <div className="space-y-3" role="status">
      <div className="flex items-start gap-3">
        {filledCount > 0 ? (
          <span className="flex h-9 w-9 shrink-0 animate-pop items-center justify-center rounded-full bg-ok-soft text-ok">
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              <path
                d="m4.5 10.5 3.5 3.5 7.5-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-draw animate-draw"
              />
            </svg>
          </span>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle-2 text-muted">
            <AlertCircleIcon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-fg">
            {filledCount > 0 ? 'Application fields filled' : 'Nothing was filled'}
          </h2>
          <p className="text-xs text-muted">
            {filledCount === 0
              ? 'JobFill didn’t fill any fields.'
              : `JobFill filled ${filledCount} ${filledCount === 1 ? 'field' : 'fields'}.`}
          </p>
        </div>
      </div>

      {/* Counts come straight from the verified run — nothing is reported as filled unless it was. */}
      <dl className="grid animate-fade grid-cols-4 gap-1.5 text-center">
        {[
          { label: 'Detected', value: detected, tone: 'text-fg' },
          { label: 'Filled', value: filledCount, tone: 'text-ok' },
          { label: 'Review', value: review.length, tone: 'text-warn' },
          { label: 'Your input', value: questions.length, tone: 'text-accent' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse rounded-md bg-subtle px-1 py-1.5">
            <dt className="text-[10px] leading-tight text-muted">{stat.label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${stat.tone}`}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {filled.length > 0 && (
        <ul className="max-h-48 space-y-0.5 overflow-y-auto text-sm">
          {filled.map((item, i) => (
            <li
              key={item.fieldId}
              className="flex animate-enter items-center gap-2 text-fg"
              // A short stagger for the first few rows only; the rest appear together.
              style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
            >
              <CheckIcon className="h-4 w-4 shrink-0 animate-pop text-ok" />
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {review.length > 0 && (
        <div className="rounded-lg border border-warn-line bg-warn-soft p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-warn">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {review.length} {review.length === 1 ? 'field requires' : 'fields require'} review
          </p>
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-xs text-warn">
            {review.map((item) => (
              <li key={item.fieldId}>
                <span className="font-medium">{item.label}</span>
                {item.preview && <span className="text-warn"> — “{item.preview}”</span>}
                <span className="block text-warn">{item.reason}</span>
                {resumePending.has(item.fieldId) && <AttachResumeButton fieldId={item.fieldId} />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="rounded-lg border border-line p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <PencilIcon className="h-4 w-4 shrink-0 text-muted" />
            {questions.length} {questions.length === 1 ? 'question needs' : 'questions need'} your
            words
          </p>
          <ul className="mt-2 space-y-2 text-xs">
            {questions.map((item) => (
              <li key={item.fieldId} className="flex items-start gap-2">
                <span className="min-w-0 flex-1 text-fg">{item.label}</span>
                <button
                  type="button"
                  onClick={() => onAskAI(item)}
                  className="shrink-0 rounded-md bg-accent-soft px-2 py-1 font-medium text-accent hover:bg-accent-soft"
                >
                  ✨ Generate with AI
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {skipped > 0 && (
        <p className="text-xs text-muted">
          {skipped} other {skipped === 1 ? 'field' : 'fields'} left as they are.
        </p>
      )}

      {revealed > 0 && (
        <p className="text-xs text-muted">
          {revealed} new {revealed === 1 ? 'field' : 'fields'} appeared after filling. Run Autofill
          again to fill {revealed === 1 ? 'it' : 'them'}.
        </p>
      )}

      <p className="rounded-lg bg-subtle-2 px-3 py-2 text-xs text-body">
        Review the form, then submit it yourself. JobFill never submits applications.
      </p>
      <Button variant="secondary" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
