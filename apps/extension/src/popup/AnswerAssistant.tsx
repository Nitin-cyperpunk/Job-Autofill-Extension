import { useEffect, useState } from 'react';
import {
  buildContextItems,
  buildRequest,
  type AnswerVariants,
  type ContextItem,
  type ContextItemId,
  type QuestionInput,
  type JobContext,
} from '@jobfill/ai';
import type { MessageResponse } from '@jobfill/shared';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { LockIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { cx } from '@/utils/cx';
import { sendToFrame } from '@/utils/frames';
import { sendToBackground, targetTabId } from '@/utils/messaging';

type Status = MessageResponse<'AI_STATUS'>;
type VariantKey = keyof AnswerVariants;

type Step =
  | { name: 'loading' }
  | { name: 'off'; status: Status }
  | { name: 'consent' }
  | { name: 'generating' }
  | { name: 'choose'; variants: AnswerVariants }
  | { name: 'confirm-replace'; text: string }
  | { name: 'inserted' }
  | { name: 'error'; message: string; retry: 'generate' | 'insert' | null };

const VARIANTS: Array<{ key: VariantKey; label: string }> = [
  { key: 'answer', label: 'Generated' },
  { key: 'concise', label: 'Concise' },
  { key: 'professional', label: 'Professional' },
];

function openSettings() {
  void chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html#/profile') });
}

/**
 * Optional AI help for ONE open question. Nothing leaves the device until the user
 * has seen exactly what will be sent and clicked "Generate Answer"; the chosen
 * answer is only inserted on "Insert Answer"; the form is never submitted.
 */
export function AnswerAssistant({
  uid,
  label,
  onClose,
}: {
  uid: string;
  label: string;
  onClose: () => void;
}) {
  const { profile } = useProfile();
  const [frameId, fieldId] = [
    Number(uid.slice(0, uid.indexOf(':'))),
    uid.slice(uid.indexOf(':') + 1),
  ];
  const [step, setStep] = useState<Step>({ name: 'loading' });
  const [status, setStatus] = useState<Status | null>(null);
  const [question, setQuestion] = useState<QuestionInput | null>(null);
  const [job, setJob] = useState<JobContext>({});
  const [items, setItems] = useState<ContextItem[]>([]);
  const [approved, setApproved] = useState<Set<ContextItemId>>(new Set());
  const [chosen, setChosen] = useState<VariantKey>('answer');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [s, ctx] = await Promise.all([
          sendToBackground({ type: 'AI_STATUS' }),
          targetTabId().then((tabId) =>
            sendToFrame(tabId, frameId, { type: 'AI_QUESTION_CONTEXT', fieldId }),
          ),
        ]);
        setStatus(s);
        if (!s.configured) return setStep({ name: 'off', status: s });
        if (!ctx.ok) return setStep({ name: 'error', message: ctx.message, retry: null });
        const q: QuestionInput = {
          question: ctx.question,
          kind: ctx.kind,
          ...(ctx.maxLength ? { maxLength: ctx.maxLength } : {}),
        };
        const offered = buildContextItems(q, profile, ctx.job);
        setQuestion(q);
        setJob(ctx.job);
        setItems(offered);
        setApproved(new Set(offered.filter((i) => i.selected).map((i) => i.id)));
        setStep({ name: 'consent' });
      } catch {
        setStep({
          name: 'error',
          message: 'JobFill can’t reach this page. Reload the tab and try again.',
          retry: null,
        });
      }
    })();
  }, [frameId, fieldId, profile]);

  async function generate() {
    if (!question) return;
    setStep({ name: 'generating' });
    // Only the approved items go into the request. The background adds credentials, nothing else.
    const request = buildRequest(question, profile, job, approved);
    const res = await sendToBackground({ type: 'AI_GENERATE', request }).catch(() => null);
    if (!res)
      return setStep({
        name: 'error',
        message: 'Couldn’t reach JobFill’s background worker.',
        retry: 'generate',
      });
    if (!res.ok) return setStep({ name: 'error', message: res.message, retry: 'generate' });
    setChosen('answer');
    setDraft(res.variants.answer);
    setStep({ name: 'choose', variants: res.variants });
  }

  async function insert(text: string, replace = false) {
    const tabId = await targetTabId();
    const res = await sendToFrame(tabId, frameId, {
      type: 'AI_INSERT',
      fieldId,
      text,
      replace,
    }).catch(() => null);
    if (!res)
      return setStep({
        name: 'error',
        message: 'JobFill can’t reach this page any more.',
        retry: null,
      });
    if (res.ok) return setStep({ name: 'inserted' });
    if (res.hasValue) return setStep({ name: 'confirm-replace', text });
    setStep({ name: 'error', message: res.message, retry: 'insert' });
  }

  const toggle = (id: ContextItemId) =>
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">
          AI-assisted answer
        </p>
        <h2 className="text-sm font-semibold text-slate-900">“{label}”</h2>
      </div>

      {step.name === 'loading' && <p className="text-sm text-slate-500">Preparing…</p>}

      {step.name === 'off' && (
        <div className="space-y-3">
          <Alert tone="info">
            {step.status.enabled
              ? (step.status.problem ?? 'AI answers aren’t fully set up yet.')
              : 'AI answers are optional and currently off. JobFill works fully without them.'}
          </Alert>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Back
            </Button>
            <Button className="flex-1" onClick={openSettings}>
              {step.status.enabled ? 'Open AI settings' : 'Turn on in settings'}
            </Button>
          </div>
        </div>
      )}

      {step.name === 'consent' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">AI will use:</p>
          <ul className="space-y-1 rounded-lg border border-slate-200 p-1">
            {items.map((item) => (
              <li key={item.id} className="rounded-md px-2 py-1.5 hover:bg-slate-50">
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={approved.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className="text-xs text-slate-500">
                      {' '}
                      · from {item.source === 'page' ? 'this page' : 'your profile'}
                    </span>
                  </span>
                </label>
                <details className="ml-6 text-xs text-slate-600">
                  <summary className="cursor-pointer text-brand-600">
                    Show exactly what’s sent
                  </summary>
                  <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-line">
                    {item.preview}
                  </p>
                </details>
              </li>
            ))}
            <li className="px-2 py-1.5 text-xs text-slate-500">…plus the question itself.</li>
          </ul>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
            <p>
              <strong>Sent to:</strong> {status?.destination}
            </p>
            <p className="mt-1">
              <strong>Never sent:</strong> your name, email, phone, address, links, salary,
              work-authorization or demographic answers, or your resume file.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => void generate()}>
              Generate Answer
            </Button>
          </div>
        </div>
      )}

      {step.name === 'generating' && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Asking {status?.destination}…
        </p>
      )}

      {step.name === 'choose' && (
        <div className="space-y-3">
          <div
            className="flex gap-1 rounded-lg bg-slate-100 p-1"
            role="radiogroup"
            aria-label="Answer version"
          >
            {VARIANTS.map(({ key, label: text }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={chosen === key}
                onClick={() => {
                  setChosen(key);
                  setDraft(step.variants[key]);
                }}
                className={cx(
                  'flex-1 rounded-md px-2 py-1 text-xs font-medium',
                  chosen === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600',
                )}
              >
                {text}
              </button>
            ))}
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={9}
            aria-label="Answer (you can edit it)"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
          />
          <p className="text-xs text-slate-500">
            Check it’s accurate and sounds like you — AI can get details wrong.{' '}
            {question?.maxLength
              ? `Limit: ${question.maxLength} characters (${draft.length} used).`
              : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep({ name: 'consent' })}>
              Back
            </Button>
            <Button className="flex-1" disabled={!draft.trim()} onClick={() => void insert(draft)}>
              Insert Answer
            </Button>
          </div>
        </div>
      )}

      {step.name === 'confirm-replace' && (
        <div className="space-y-3">
          <Alert tone="info">This field already has text. Replace it with the AI answer?</Alert>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Keep existing text
            </Button>
            <Button className="flex-1" onClick={() => void insert(step.text, true)}>
              Replace
            </Button>
          </div>
        </div>
      )}

      {step.name === 'inserted' && (
        <div className="space-y-3">
          <Alert tone="success">
            Answer inserted. Review it on the page — JobFill never submits applications.
          </Alert>
          <Button className="w-full" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      )}

      {step.name === 'error' && (
        <div className="space-y-3">
          <Alert tone="error">{step.message}</Alert>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {step.retry === 'generate' && (
              <Button className="flex-1" onClick={() => void generate()}>
                Try again
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <LockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        Nothing is sent until you click Generate Answer.
      </p>
    </div>
  );
}
