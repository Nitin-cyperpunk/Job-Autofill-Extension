import type { FillSummary } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { AlertCircleIcon, CheckIcon } from '@/components/ui/icons';

/**
 * JobFill filled 17 fields.
 * ✓ First Name …
 * ⚠ 2 fields require review
 */
export function FillSummaryView({ summary, onDone }: { summary: FillSummary; onDone: () => void }) {
  const { filledCount, filled, review, skipped } = summary;
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

      {skipped > 0 && (
        <p className="text-xs text-slate-500">{skipped} other fields left as they are.</p>
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
