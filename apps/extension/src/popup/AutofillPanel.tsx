import { useEffect, useState } from 'react';
import type { PlanItem } from '@jobfill/field-mapper';
import type { FillResultItem, FillSummary } from '@jobfill/shared';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CheckboxField } from '@/components/ui/Field';
import { loadSettings, saveSettings } from '@/storage';
import { fillAllFrames, planAllFrames } from '@/utils/frames';
import { AnswerAssistant } from './AnswerAssistant';
import { FillSummaryView } from './FillSummaryView';
import { PreviewList } from './PreviewList';

type State =
  | { step: 'idle' }
  | { step: 'working'; label: string }
  | { step: 'preview'; items: PlanItem[] }
  | { step: 'done'; summary: FillSummary }
  | { step: 'ai'; summary: FillSummary; question: FillResultItem }
  | { step: 'error'; message: string };

const UNREACHABLE =
  'JobFill can’t reach this page. Reload the tab and try again (browser pages and the Chrome Web Store can’t be filled).';

/**
 * "Autofill Application" with an optional safe mode that previews every field
 * first. Either way, JobFill only fills — the user reviews and submits.
 */
export function AutofillPanel() {
  const [preview, setPreview] = useState<boolean | null>(null);
  const [state, setState] = useState<State>({ step: 'idle' });

  useEffect(() => {
    void loadSettings().then((s) => setPreview(s.previewBeforeFill));
  }, []);

  async function togglePreview(next: boolean) {
    setPreview(next);
    await saveSettings({ previewBeforeFill: next });
  }

  async function execute(fieldIds?: string[]) {
    setState({ step: 'working', label: 'Filling…' });
    try {
      setState({ step: 'done', summary: await fillAllFrames(fieldIds) });
    } catch {
      setState({ step: 'error', message: UNREACHABLE });
    }
  }

  async function start() {
    if (!preview) return execute();
    setState({ step: 'working', label: 'Reading the form…' });
    try {
      setState({ step: 'preview', items: await planAllFrames() });
    } catch {
      setState({ step: 'error', message: UNREACHABLE });
    }
  }

  if (state.step === 'preview') {
    return (
      <PreviewList
        items={state.items}
        onFill={(ids) => void execute(ids)}
        onCancel={() => setState({ step: 'idle' })}
      />
    );
  }

  if (state.step === 'done') {
    const summary = state.summary;
    return (
      <FillSummaryView
        summary={summary}
        onDone={() => setState({ step: 'idle' })}
        onAskAI={(question) => setState({ step: 'ai', summary, question })}
      />
    );
  }

  if (state.step === 'ai') {
    const summary = state.summary;
    return (
      <AnswerAssistant
        uid={state.question.fieldId}
        label={state.question.label}
        onClose={() => setState({ step: 'done', summary })}
      />
    );
  }

  const working = state.step === 'working';
  return (
    <div className="space-y-3">
      <Button onClick={start} loading={working} className="w-full" disabled={preview === null}>
        {working ? state.label : 'Autofill Application'}
      </Button>
      {preview !== null && (
        <CheckboxField
          label="Preview fields before filling"
          description="Safe mode: see every value and choose what gets filled."
          checked={preview}
          onChange={(v) => void togglePreview(v)}
        />
      )}
      {state.step === 'error' && <Alert tone="error">{state.message}</Alert>}
    </div>
  );
}
