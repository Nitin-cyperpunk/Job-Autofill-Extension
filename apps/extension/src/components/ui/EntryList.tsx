import { useState, type ReactNode } from 'react';
import { scopeErrors, type FieldErrors } from '@jobfill/shared';
import { cx } from '@/utils/cx';
import { Button } from './Button';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from './icons';

interface EntryListProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  /** Heading for an item, e.g. "Senior Engineer · Acme". */
  itemTitle: (item: T, index: number) => string;
  itemSubtitle?: (item: T) => string;
  addLabel: string;
  emptyText: string;
  errors: FieldErrors;
  renderItem: (item: T, update: (patch: Partial<T>) => void, errors: FieldErrors) => ReactNode;
}

/** A reorderable, collapsible list of repeatable entries (education, experience, …). */
export function EntryList<T extends { id: string }>({
  items,
  onChange,
  create,
  itemTitle,
  itemSubtitle,
  addLabel,
  emptyText,
  errors,
  renderItem,
}: EntryListProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(items.length === 1 ? [items[0]!.id] : []),
  );

  function toggle(id: string, open?: boolean) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function add() {
    const item = create();
    onChange([...items, item]);
    toggle(item.id, true);
  }

  function move(index: number, delta: -1 | 1) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
          {emptyText}
        </p>
      )}

      {items.map((item, index) => {
        const itemErrors = scopeErrors(errors, String(index));
        const hasErrors = Object.keys(itemErrors).length > 0;
        const isOpen = expanded.has(item.id) || hasErrors;
        const subtitle = itemSubtitle?.(item);
        const update = (patch: Partial<T>) =>
          onChange(items.map((it) => (it.id === item.id ? { ...it, ...patch } : it)));

        return (
          <div
            key={item.id}
            className={cx(
              'rounded-xl border bg-surface',
              hasErrors ? 'border-danger-line' : 'border-line',
            )}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDownIcon
                  className={cx(
                    'h-4 w-4 shrink-0 text-faint transition-transform',
                    !isOpen && '-rotate-90',
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">
                    {itemTitle(item, index)}
                  </span>
                  {subtitle && (
                    <span className="block truncate text-xs text-muted">{subtitle}</span>
                  )}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                icon={<ChevronUpIcon />}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Move down"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                icon={<ChevronDownIcon />}
              />
              <Button
                variant="danger-ghost"
                size="sm"
                aria-label={`Delete ${itemTitle(item, index)}`}
                onClick={() => onChange(items.filter((it) => it.id !== item.id))}
                icon={<TrashIcon />}
              />
            </div>
            {isOpen && (
              <div className="border-t border-line px-4 pt-4 pb-5">
                {renderItem(item, update, itemErrors)}
              </div>
            )}
          </div>
        );
      })}

      <Button variant="secondary" onClick={add} icon={<PlusIcon />}>
        {addLabel}
      </Button>
    </div>
  );
}
