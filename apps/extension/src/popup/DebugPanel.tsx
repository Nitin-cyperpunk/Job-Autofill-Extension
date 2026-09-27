import { useEffect, useState } from 'react';
import { mappedKey } from '@/field-detection/debug-format';
import type { MessageResponse } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { sendToActiveTab } from '@/utils/messaging';

type Detection = MessageResponse<'DETECT_FIELDS'>;

/** Dev/debug builds only: inspect what the detector sees on the current tab. */
export function DebugPanel() {
  const [data, setData] = useState<Detection | null>(null);
  const [error, setError] = useState('');
  const [overlay, setOverlay] = useState(false);

  function refresh() {
    return sendToActiveTab({ type: 'DETECT_FIELDS' }).then(
      (result) => {
        setData(result);
        setError('');
      },
      () => setError('No content script on this tab (reload it, or it’s a browser page).'),
    );
  }

  useEffect(() => {
    // State is only set once the message resolves, never synchronously in the effect.
    void refresh();
  }, []);

  async function toggleOverlay() {
    const next = !overlay;
    await sendToActiveTab({ type: 'DEBUG_OVERLAY', show: next }).catch(() => null);
    setOverlay(next);
  }

  return (
    <section className="mt-4 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
          Debug · detected fields
        </h2>
        <span className="text-xs text-amber-800 tabular-nums">
          {data ? `${data.count} · scan ${data.stats.lastScanMs} ms · #${data.stats.scans}` : ''}
        </span>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="mb-2 flex gap-2">
        <Button size="sm" variant="secondary" onClick={refresh}>
          Rescan
        </Button>
        <Button size="sm" variant="secondary" onClick={toggleOverlay}>
          {overlay ? 'Hide overlay' : 'Show overlay'}
        </Button>
      </div>
      <ul className="max-h-60 space-y-1 overflow-y-auto text-xs">
        {data?.fields.map((f) => {
          const key = mappedKey(f);
          return (
            <li key={f.id} className="rounded bg-white px-2 py-1 ring-1 ring-amber-200">
              <span className="font-medium text-slate-900">{f.label || '(no label)'}</span>
              {f.required && <span className="text-red-600">*</span>}
              <span className="text-slate-500">
                {' '}
                · {f.type} · via {f.labelSource}
                {f.options.length ? ` · ${f.options.length} options` : ''}
              </span>
              {key && <span className="block text-emerald-700">→ {key}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
