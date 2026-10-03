import { useEffect, useState, type ReactNode } from 'react';
import type { PlanItem } from '@jobfill/field-mapper';
import { Button } from '@/components/ui/Button';
import type { FieldOutcome } from '@jobfill/shared';
import {
  framesWithFields,
  planAllFrames,
  sendToFrame,
  type PlanItemWithOutcome,
} from '@/utils/frames';
import { targetTabId } from '@/utils/messaging';

/**
 * Debug mode: what the engine sees and decides on the current tab (all frames).
 *
 *   Email
 *   → personal.email · 99%
 *   label "Email" matched "email"
 */
export function DebugPanel() {
  const [items, setItems] = useState<PlanItemWithOutcome[] | null>(null);
  const [error, setError] = useState('');
  const [overlay, setOverlay] = useState(false);

  function refresh() {
    return planAllFrames().then(
      (plan) => {
        setItems(plan);
        setError('');
      },
      () => setError('No content script on this tab (reload it, or it’s a browser page).'),
    );
  }

  useEffect(() => {
    // State is only set once the plan resolves, never synchronously in the effect.
    void refresh();
  }, []);

  async function toggleOverlay() {
    const next = !overlay;
    const tabId = await targetTabId();
    for (const frameId of await framesWithFields(tabId)) {
      await sendToFrame(tabId, frameId, { type: 'DEBUG_OVERLAY', show: next }).catch(() => null);
    }
    setOverlay(next);
  }

  const mapped = items?.filter((i) => i.key) ?? [];
  const unmapped = items?.filter((i) => !i.key) ?? [];
  const frames = new Set(items?.map((i) => i.fieldId.split(':')[0]));

  return (
    <section className="mt-4 rounded-lg border border-dashed border-warn bg-warn-soft p-3 text-xs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-semibold tracking-wide text-warn uppercase">Debug mode</h2>
        {items && (
          <span className="text-warn tabular-nums">
            {items.length} detected · {mapped.length} mapped · {unmapped.length} unmapped
            {frames.size > 1 ? ` · ${frames.size} frames` : ''}
          </span>
        )}
      </div>
      {error && <p className="mb-2 text-danger">{error}</p>}
      <div className="mb-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => void refresh()}>
          Rescan
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void toggleOverlay()}>
          {overlay ? 'Hide overlay' : 'Show overlay'}
        </Button>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {mapped.length > 0 && (
          <DebugGroup title="Mapped fields">
            {mapped.map((item) => (
              <DebugRow key={item.fieldId} item={item}>
                <span className="block font-mono text-ok">
                  → {item.key} · {Math.round(item.confidence * 100)}%
                </span>
                <span className="block text-muted">{item.why}</span>
                <FillStatus outcome={item.lastFill} />
                {!item.lastFill && item.status !== 'fill' && (
                  <span className="block text-warn">
                    {statusLabel(item)}: {item.reason}
                  </span>
                )}
              </DebugRow>
            ))}
          </DebugGroup>
        )}
        {unmapped.length > 0 && (
          <DebugGroup title="Unmapped fields">
            {unmapped.map((item) => (
              <DebugRow key={item.fieldId} item={item}>
                <span className="block font-mono text-muted">→ Unmapped</span>
                <span className="block text-muted">{item.why}</span>
              </DebugRow>
            ))}
          </DebugGroup>
        )}
      </div>
    </section>
  );
}

const STATUS: Record<FieldOutcome['status'], { icon: string; label: string; className: string }> = {
  filled: { icon: '✓', label: 'Filled', className: 'text-ok' },
  'already-filled': { icon: '●', label: 'Already Filled', className: 'text-muted' },
  'needs-review': { icon: '⚠', label: 'Needs Review', className: 'text-warn' },
  'not-filled': { icon: '○', label: 'Not Filled', className: 'text-muted' },
  unsupported: { icon: '◌', label: 'Unsupported', className: 'text-muted' },
  failed: { icon: '✕', label: 'Failed', className: 'text-danger' },
};

/** Result of the last Autofill run, verified against the live page. */
function FillStatus({ outcome }: { outcome?: FieldOutcome }) {
  if (!outcome) return null;
  const s = STATUS[outcome.status];
  return (
    <span className={`block font-medium ${s.className}`}>
      {s.icon} {s.label}
      {outcome.reason ? ` — ${outcome.reason}` : ''}
    </span>
  );
}

function statusLabel(item: PlanItem) {
  if (item.status === 'fill-review') return 'Fills, flagged for review';
  if (item.status === 'review') return 'Not filled';
  return 'Skipped';
}

function DebugGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold text-warn">{title}</h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function DebugRow({ item, children }: { item: PlanItem; children: ReactNode }) {
  return (
    <li className="rounded bg-surface px-2 py-1.5 ring-1 ring-warn-line">
      <span className="font-medium text-fg">“{item.label}”</span>
      <span className="text-muted">
        {' '}
        · {item.type}
        {item.required ? ' · required' : ''}
      </span>
      {children}
    </li>
  );
}
