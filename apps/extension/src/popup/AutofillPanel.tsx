import { useEffect, useState } from 'react';
import type { PlanItem } from '@jobfill/field-mapper';
import type { FillResultItem, FillSummary } from '@jobfill/shared';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CheckboxField } from '@/components/ui/Field';
import { loadSettings, saveSettings } from '@/storage';
import { cx } from '@/utils/cx';
import { fillAllFrames, planAllFrames } from '@/utils/frames';
import { sendToBackground, targetTabId } from '@/utils/messaging';
import { AnswerAssistant } from './AnswerAssistant';
import { FillSummaryView } from './FillSummaryView';
import { PreviewList } from './PreviewList';
import type { Readiness } from './usePageReadiness';

type Phase = 'reading' | 'filling';

type State =
  | { step: 'idle' }
  | { step: 'working'; phase: Phase }
  | { step: 'preview'; items: PlanItem[] }
  | { step: 'done'; summary: FillSummary }
  | { step: 'ai'; summary: FillSummary; question: FillResultItem }
  | { step: 'error'; message: string };

const UNREACHABLE =
  'JobFill can’t reach this page. Reload the tab and try again (browser pages and the Chrome Web Store can’t be filled).';

/**
 * "Autofill Application" with an optional safe mode that previews every field
 * first. Either way, JobFill only fills — the user reviews and submits.
 *
 * Progress reflects real work only: each step completes when its call resolves,
 * with no artificial delays.
 */
export function AutofillPanel({ readiness }: { readiness?: Readiness }) {
  const [preview, setPreview] = useState<boolean | null>(null);
  const [fillNewSteps, setFillNewSteps] = useState(true);
  const [state, setState] = useState<State>({ step: 'idle' });
  const session = useFillSession(state.step);

  useEffect(() => {
    void loadSettings().then((s) => {
      setPreview(s.previewBeforeFill);
      setFillNewSteps(s.fillNewSteps);
    });
  }, []);

  async function toggleFillNewSteps(next: boolean) {
    setFillNewSteps(next);
    await saveSettings({ fillNewSteps: next });
    if (!next) await session.stop();
  }

  async function togglePreview(next: boolean) {
    setPreview(next);
    await saveSettings({ previewBeforeFill: next });
  }

  async function execute(fieldIds?: string[]) {
    setState({ step: 'working', phase: 'filling' });
    try {
      // Preview mode approves field by field, so it never starts an automatic session.
      const continueSession = !fieldIds && !preview && fillNewSteps;
      setState({ step: 'done', summary: await fillAllFrames(fieldIds, { continueSession }) });
    } catch {
      setState({ step: 'error', message: UNREACHABLE });
    }
  }

  async function start() {
    if (!preview) return execute();
    setState({ step: 'working', phase: 'reading' });
    try {
      setState({ step: 'preview', items: await planAllFrames() });
    } catch {
      setState({ step: 'error', message: UNREACHABLE });
    }
  }

  if (state.step === 'preview') {
    return (
      <div className="animate-enter">
        <PreviewList
          items={state.items}
          onFill={(ids) => void execute(ids)}
          onCancel={() => setState({ step: 'idle' })}
        />
      </div>
    );
  }

  if (state.step === 'done') {
    const summary = state.summary;
    return (
      <div className="animate-enter">
        <FillSummaryView
          summary={summary}
          onDone={() => setState({ step: 'idle' })}
          onAskAI={(question) => setState({ step: 'ai', summary, question })}
        />
      </div>
    );
  }

  if (state.step === 'ai') {
    const summary = state.summary;
    return (
      <div className="animate-enter">
        <AnswerAssistant
          uid={state.question.fieldId}
          label={state.question.label}
          onClose={() => setState({ step: 'done', summary })}
        />
      </div>
    );
  }

  if (state.step === 'working') {
    return <FillProgress phase={state.phase} readiness={readiness} />;
  }

  return (
    <div className="space-y-3">
      <Button onClick={start} size="lg" className="w-full" disabled={preview === null}>
        Autofill Application
      </Button>
      {session.active && (
        <div
          role="status"
          className="flex animate-fade items-start gap-2 rounded-lg border border-accent-line bg-accent-soft px-3 py-2 text-xs text-body"
        >
          <span className="flex-1">
            Filling new steps of this application as they appear
            {session.filled > 0 ? ` · ${session.filled} filled so far` : ''}
            {session.review > 0 ? ` · ${session.review} to review` : ''}. You still click Next and
            Submit.
          </span>
          <button
            type="button"
            onClick={() => void session.stop()}
            className="shrink-0 font-medium text-accent hover:underline"
          >
            Stop
          </button>
        </div>
      )}
      {preview !== null && (
        <>
          <CheckboxField
            label="Preview fields before filling"
            description="Safe mode: see every value and choose what gets filled."
            checked={preview}
            onChange={(v) => void togglePreview(v)}
          />
          <CheckboxField
            label="Keep filling new steps"
            description={
              preview
                ? 'Off while previewing — each step is approved by you.'
                : 'Multi-step forms: fill each new step (address, gender, DOB…) as it appears. Never clicks Next or Submit.'
            }
            checked={fillNewSteps && !preview}
            onChange={(v) => void toggleFillNewSteps(v)}
          />
        </>
      )}
      {state.step === 'error' && (
        <div className="animate-enter">
          <Alert tone="error">{state.message}</Alert>
        </div>
      )}
    </div>
  );
}

/**
 * Real progress: "Analyzing" is done once the page's fields are known (at popup open,
 * or when previewing), "Filling" covers writing and re-checking each value in the page.
 */
function FillProgress({ phase, readiness }: { phase: Phase; readiness?: Readiness }) {
  const detected = readiness?.state === 'ready' ? readiness.detected : null;
  const steps: Array<{ label: string; detail?: string; status: 'done' | 'active' | 'pending' }> =
    phase === 'reading'
      ? [
          { label: 'Analyzing application', status: 'active' },
          { label: 'Matching fields to your profile', status: 'pending' },
        ]
      : [
          {
            label: 'Analyzing application',
            detail:
              detected !== null ? `${detected} ${detected === 1 ? 'field' : 'fields'}` : undefined,
            status: 'done',
          },
          { label: 'Filling and checking fields', status: 'active' },
        ];
  return (
    <div role="status" aria-live="polite" className="animate-fade space-y-3">
      <div className="h-1 overflow-hidden rounded-full bg-subtle-2" aria-hidden="true">
        <div className="h-full w-2/5 animate-indeterminate rounded-full bg-brand-500" />
      </div>
      <ol className="space-y-2 text-sm">
        {steps.map((s) => (
          <li
            key={s.label}
            className={cx(
              'flex items-center gap-2.5',
              s.status === 'pending' ? 'text-faint' : 'text-fg',
            )}
          >
            <StepIcon status={s.status} />
            <span className="flex-1">
              {s.label}
              {s.status === 'active' && '…'}
            </span>
            {s.detail && <span className="text-xs text-muted">{s.detail}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepIcon({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done')
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 animate-pop text-ok" aria-hidden="true">
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
    );
  if (status === 'active')
    return (
      <span
        aria-hidden="true"
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-r-transparent"
      />
    );
  return <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border-2 border-line" />;
}

/** The tab's "keep filling new steps" session, refreshed after each fill. */
function useFillSession(step: State['step']) {
  const [status, setStatus] = useState({ active: false, filled: 0, review: 0 });
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const id = await targetTabId();
        const res = await sendToBackground({ type: 'AUTOFILL_SESSION_STATUS', tabId: id });
        if (!cancelled) {
          setTabId(id);
          setStatus(res);
        }
      } catch {
        // No tab / no background: nothing to show.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  return {
    ...status,
    async stop() {
      if (tabId === null) return;
      await sendToBackground({ type: 'AUTOFILL_SESSION_STOP', tabId }).catch(() => null);
      setStatus({ active: false, filled: 0, review: 0 });
    },
  };
}
