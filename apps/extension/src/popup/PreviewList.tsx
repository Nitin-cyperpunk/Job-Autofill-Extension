import { useState } from 'react';
import { CATEGORY_LABELS, type PlanItem } from '@jobfill/field-mapper';
import { Button } from '@/components/ui/Button';
import { AlertCircleIcon } from '@/components/ui/icons';

/** Safe mode: every value JobFill would enter, each with its own checkbox. */
export function PreviewList({
  items,
  onFill,
  onCancel,
}: {
  items: PlanItem[];
  onFill: (fieldIds: string[]) => void;
  onCancel: () => void;
}) {
  const fillable = items.filter(
    (i) => i.action && (i.status === 'fill' || i.status === 'fill-review'),
  );
  const needsYou = items.filter((i) => i.status === 'review');
  // Fields the user already typed in: never ticked by default — replacing is opt-in.
  const replaceable = items.filter((i) => i.replaceable && i.action);
  const skipped = items.length - fillable.length - needsYou.length - replaceable.length;
  const [selected, setSelected] = useState(() => new Set(fillable.map((i) => i.fieldId)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-fg">Preview</h2>
        <p className="text-xs text-muted">
          {items.length} fields found · {fillable.length} can be filled. Nothing is changed until
          you confirm.
        </p>
      </div>

      {fillable.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-line p-1">
          {fillable.map((item) => (
            <li key={item.fieldId}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-subtle">
                <input
                  type="checkbox"
                  checked={selected.has(item.fieldId)}
                  onChange={() => toggle(item.fieldId)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-fg">{item.label}</span>
                  <span className="block truncate text-xs text-muted">{item.preview}</span>
                  {item.status === 'fill-review' && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-warn">
                      <AlertCircleIcon className="h-3 w-3 shrink-0" />
                      {item.reason}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong p-3 text-center text-xs text-muted">
          No fields on this page match your profile.
        </p>
      )}

      {replaceable.length > 0 && (
        <details className="rounded-lg border border-line px-3 py-2 text-xs">
          <summary className="cursor-pointer font-medium text-fg">
            {replaceable.length} already filled — kept as you entered{' '}
            {replaceable.length === 1 ? 'it' : 'them'}
          </summary>
          <ul className="mt-2 space-y-1">
            {replaceable.map((item) => (
              <li key={item.fieldId}>
                <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 hover:bg-subtle">
                  <input
                    type="checkbox"
                    checked={selected.has(item.fieldId)}
                    onChange={() => toggle(item.fieldId)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg">{item.label}</span>
                    <span className="block truncate text-muted">
                      Replace with JobFill value: {item.preview}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      )}

      {needsYou.length > 0 && (
        <details className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
          <summary className="cursor-pointer font-medium">
            {needsYou.length} {needsYou.length === 1 ? 'field needs' : 'fields need'} you
          </summary>
          <ul className="mt-1 space-y-1">
            {needsYou.map((item) => (
              <li key={item.fieldId}>
                <span className="font-medium">{item.label}</span>
                {item.category !== 'UNKNOWN' && (
                  <span className="text-warn/80"> · {CATEGORY_LABELS[item.category]}</span>
                )}{' '}
                — {item.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {skipped > 0 && (
        <p className="text-xs text-muted">
          {skipped} other {skipped === 1 ? 'field' : 'fields'} left as they are.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          disabled={selected.size === 0}
          onClick={() => onFill([...selected])}
        >
          Fill {selected.size} {selected.size === 1 ? 'field' : 'fields'}
        </Button>
      </div>
    </div>
  );
}
