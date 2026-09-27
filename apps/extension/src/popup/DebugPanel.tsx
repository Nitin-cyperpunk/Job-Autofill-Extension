import { useEffect, useState, type ReactNode } from 'react';
import type { PlanItem } from '@jobfill/field-mapper';
import { Button } from '@/components/ui/Button';
import { framesWithFields, planAllFrames, sendToFrame } from '@/utils/frames';
import { targetTabId } from '@/utils/messaging';

/**
 * Debug mode: what the engine sees and decides on the current tab (all frames).
 *
 *   Email
 *   → personal.email · 99%
 *   label "Email" matched "email"
 */
export function DebugPanel() {
  const [items, setItems] = useState<PlanItem[] | null>(null);
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
    <section className="mt-4 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3 text-xs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-semibold tracking-wide text-amber-900 uppercase">Debug mode</h2>
        {items && (
          <span className="text-amber-800 tabular-nums">
            {items.length} detected · {mapped.length} mapped · {unmapped.length} unmapped
            {frames.size > 1 ? ` · ${frames.size} frames` : ''}
          </span>
        )}
      </div>
      {error && <p className="mb-2 text-red-700">{error}</p>}
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
                <span className="block font-mono text-emerald-800">
                  → {item.key} · {Math.round(item.confidence * 100)}%
                </span>
                <span className="block text-slate-600">{item.why}</span>
                {item.status !== 'fill' && (
                  <span className="block text-amber-700">
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
                <span className="block font-mono text-slate-500">→ Unmapped</span>
                <span className="block text-slate-600">{item.why}</span>
              </DebugRow>
            ))}
          </DebugGroup>
        )}
      </div>
    </section>
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
      <h3 className="mb-1 font-semibold text-amber-900">{title}</h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function DebugRow({ item, children }: { item: PlanItem; children: ReactNode }) {
  return (
    <li className="rounded bg-white px-2 py-1.5 ring-1 ring-amber-200">
      <span className="font-medium text-slate-900">“{item.label}”</span>
      <span className="text-slate-500">
        {' '}
        · {item.type}
        {item.required ? ' · required' : ''}
      </span>
      {children}
    </li>
  );
}
