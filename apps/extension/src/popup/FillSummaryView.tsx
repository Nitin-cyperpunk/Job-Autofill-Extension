import type { FillResultItem, FillSummary } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { AlertCircleIcon, CheckIcon, PencilIcon } from '@/components/ui/icons';

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
  const { filledCount, filled, review, skipped, revealed = 0, questions = [] } = summary;
  return (
    <div className="space-y-3" role="status">
      <h2 className="text-base font-semibold text-slate-900">
        {filledCount === 0
          ? 'JobFill didn’t fill any fields.'
          : `JobFill filled ${filledCount} ${filledCount === 1 ? 'field' : 'fields'}.`}
      </h2>

      {filled.length > 0 && (
        <ul className="max-h-48 space-y-0.5 overflow-y-auto text-sm">
          {filled.map((item) => (
            <li key={item.fieldId} className="flex items-center gap-2 text-slate-800">
              <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {review.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {review.length} {review.length === 1 ? 'field requires' : 'fields require'} review
          </p>
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-xs text-amber-900">
            {review.map((item) => (
              <li key={item.fieldId}>
                <span className="font-medium">{item.label}</span>
                {item.preview && <span className="text-amber-800"> — “{item.preview}”</span>}
                <span className="block text-amber-700">{item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PencilIcon className="h-4 w-4 shrink-0 text-slate-500" />
            {questions.length} {questions.length === 1 ? 'question needs' : 'questions need'} your
            words
          </p>
          <ul className="mt-2 space-y-2 text-xs">
            {questions.map((item) => (
              <li key={item.fieldId} className="flex items-start gap-2">
                <span className="min-w-0 flex-1 text-slate-800">{item.label}</span>
                <button
                  type="button"
                  onClick={() => onAskAI(item)}
                  className="shrink-0 rounded-md bg-brand-50 px-2 py-1 font-medium text-brand-700 hover:bg-brand-100"
                >
                  ✨ Generate with AI
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {skipped > 0 && (
        <p className="text-xs text-slate-500">{skipped} other fields left as they are.</p>
      )}

      {revealed > 0 && (
        <p className="text-xs text-slate-600">
          {revealed} new {revealed === 1 ? 'field' : 'fields'} appeared after filling. Run Autofill
          again to fill {revealed === 1 ? 'it' : 'them'}.
        </p>
      )}

      <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
        Review the form, then submit it yourself. JobFill never submits applications.
      </p>
      <Button variant="secondary" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
