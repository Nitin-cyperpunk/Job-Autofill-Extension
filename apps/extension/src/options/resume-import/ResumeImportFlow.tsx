import { useMemo, useRef, useState, type ReactNode } from 'react';
import { RESUME_ACCEPT_ATTR, RESUME_MAX_BYTES, formatBytes } from '@jobfill/shared';
import {
  ResumeTextError,
  applyReview,
  buildReview,
  extractResumeText,
  parseResumeText,
  type ExtractedResume,
  type ResumeReview,
  type ReviewItem,
} from '@jobfill/resume';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckboxField } from '@/components/ui/Field';
import { FileTextIcon, LockIcon, UploadIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { loadResume } from '@/storage';
import { base64ToBlob } from '@/utils/file';
import { cx } from '@/utils/cx';

const RESUME_PRIVACY = 'Your resume stays on this device unless you choose an AI/cloud feature.';

type Step =
  | { name: 'choose'; error?: string }
  | { name: 'reading' }
  | { name: 'review'; extracted: ExtractedResume; review: ResumeReview; file: File | null }
  | { name: 'saved'; changes: number };

/**
 * Upload résumé → extract text → identify fields → review → approve → save locally.
 * Everything runs in this page; nothing is uploaded anywhere.
 */
export function ResumeImportFlow({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const { profile } = useProfile();
  const [step, setStep] = useState<Step>({ name: 'choose' });

  async function readFile(file: File, isNewFile: boolean) {
    if (file.size > RESUME_MAX_BYTES)
      return setStep({ name: 'choose', error: 'Resumes must be 5 MB or smaller.' });
    setStep({ name: 'reading' });
    try {
      const { text } = await extractResumeText(new Uint8Array(await file.arrayBuffer()), file.name);
      review(text, isNewFile ? file : null);
    } catch (err) {
      setStep({
        name: 'choose',
        error:
          err instanceof ResumeTextError || err instanceof Error
            ? err.message
            : 'Couldn’t read this file.',
      });
    }
  }

  function review(text: string, file: File | null) {
    const extracted = parseResumeText(text);
    setStep({ name: 'review', extracted, review: buildReview(profile, extracted), file });
  }

  async function readSavedResume() {
    const stored = await loadResume();
    if (!stored)
      return setStep({
        name: 'choose',
        error: 'Your saved resume couldn’t be read. Upload it again.',
      });
    const file = new File([base64ToBlob(stored.dataBase64, stored.mimeType)], stored.fileName, {
      type: stored.mimeType,
    });
    await readFile(file, false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Fill your profile from your resume
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-emerald-800">
          <LockIcon className="h-4 w-4 shrink-0" />
          {RESUME_PRIVACY}
        </p>
      </div>

      {step.name === 'choose' && (
        <ChooseSource
          savedName={profile.resume?.fileName}
          error={step.error}
          onFile={(f) => void readFile(f, true)}
          onSaved={() => void readSavedResume()}
          onText={(t) => review(t, null)}
          onCancel={onCancel}
        />
      )}

      {step.name === 'reading' && (
        <Card>
          <p className="flex items-center gap-3 text-sm text-slate-700">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-r-transparent" />
            Reading your resume on this device…
          </p>
        </Card>
      )}

      {step.name === 'review' && (
        <ReviewScreen
          extracted={step.extracted}
          review={step.review}
          file={step.file}
          onCancel={onCancel}
          onBack={() => setStep({ name: 'choose' })}
          onSaved={(changes) => setStep({ name: 'saved', changes })}
        />
      )}

      {step.name === 'saved' && (
        <Card>
          <Alert tone="success">
            Saved {step.changes} {step.changes === 1 ? 'change' : 'changes'} to your profile — on
            this device.
          </Alert>
          <Button className="mt-4" onClick={onDone}>
            Continue
          </Button>
        </Card>
      )}
    </div>
  );
}

// ---- Choose a source ---------------------------------------------------------------------------

function ChooseSource({
  savedName,
  error,
  onFile,
  onSaved,
  onText,
  onCancel,
}: {
  savedName?: string;
  error?: string;
  onFile: (file: File) => void;
  onSaved: () => void;
  onText: (text: string) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState('');

  return (
    <Card>
      <div className="space-y-4">
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-brand-500 hover:bg-slate-50"
        >
          <input
            ref={input}
            type="file"
            accept={`${RESUME_ACCEPT_ATTR},.txt`}
            className="sr-only"
            aria-label="Choose resume file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <UploadIcon className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-slate-900">
            Drop your resume here, or click to browse
          </span>
          <span className="mt-1 text-xs text-slate-500">
            PDF, DOCX or TXT · up to {formatBytes(RESUME_MAX_BYTES)} · read on this device
          </span>
        </label>

        {savedName && (
          <Button variant="secondary" icon={<FileTextIcon />} onClick={onSaved}>
            Use my saved resume ({savedName})
          </Button>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {pasting ? (
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              aria-label="Resume text"
              placeholder="Paste the text of your resume…"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            <Button disabled={text.trim().length < 40} onClick={() => onText(text)}>
              Read this text
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-brand-600 hover:underline"
            onClick={() => setPasting(true)}
          >
            Paste text instead (for scanned PDFs or .doc files)
          </button>
        )}

        <div className="border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---- Review --------------------------------------------------------------------------------------

const ENTRY_GROUPS = [
  { id: 'experience', title: 'Experience' },
  { id: 'education', title: 'Education' },
  { id: 'projects', title: 'Projects' },
  { id: 'certifications', title: 'Certifications' },
] as const;

function ReviewScreen({
  extracted,
  review,
  file,
  onCancel,
  onBack,
  onSaved,
}: {
  extracted: ExtractedResume;
  review: ResumeReview;
  file: File | null;
  onCancel: () => void;
  onBack: () => void;
  onSaved: (changes: number) => void;
}) {
  const { profile, updateProfile, uploadResume } = useProfile();
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(review.defaults));
  const [saveFile, setSaveFile] = useState(file !== null && !profile.resume);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (id: string, on: boolean) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const byGroup = useMemo(() => {
    const scalars = review.items.filter(
      (i): i is Extract<ReviewItem, { kind: 'scalar' }> => i.kind === 'scalar',
    );
    return {
      personal: scalars.filter((i) => i.group === 'Personal'),
      professional: scalars.filter((i) => i.group === 'Professional'),
      links: scalars.filter((i) => i.group === 'Links'),
      entries: review.items.filter(
        (i): i is Extract<ReviewItem, { kind: 'entry' }> => i.kind === 'entry',
      ),
      tags: review.items.filter((i): i is Extract<ReviewItem, { kind: 'tag' }> => i.kind === 'tag'),
    };
  }, [review]);

  const conflicts = review.items.filter(
    (i) => i.kind === 'scalar' && i.status === 'conflict',
  ).length;
  const changes = accepted.size + (saveFile ? 1 : 0);

  async function save() {
    setSaving(true);
    setError('');
    try {
      // Applied to the latest stored profile; only accepted items change.
      await updateProfile((current) =>
        applyReview(current, extracted, buildReview(current, extracted), accepted),
      );
      if (saveFile && file) await uploadResume(file);
      onSaved(changes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  if (review.items.length === 0) {
    return (
      <Card>
        <Alert tone="info">
          {review.unchanged > 0
            ? 'Your profile already matches everything we could read from this resume.'
            : 'We couldn’t recognise profile details in this resume. Try another file or paste the text.'}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            Try another file
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Close
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        We found <strong>{review.items.length}</strong> things to add or update
        {conflicts > 0 && (
          <>
            , including <strong>{conflicts}</strong>{' '}
            {conflicts === 1 ? 'difference' : 'differences'} from your profile
          </>
        )}
        {review.unchanged > 0 && <> · {review.unchanged} already match</>}. Nothing is saved until
        you approve.
      </p>

      <ScalarGroup
        title="Personal information"
        items={byGroup.personal}
        accepted={accepted}
        onSet={set}
      />
      <ScalarGroup
        title="Professional"
        items={byGroup.professional}
        accepted={accepted}
        onSet={set}
      />
      <ScalarGroup title="Links" items={byGroup.links} accepted={accepted} onSet={set} />

      {ENTRY_GROUPS.map(({ id, title }) => {
        const items = byGroup.entries.filter((e) => e.group === id);
        if (!items.length) return null;
        return (
          <Card key={id} title={title}>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <CheckboxField
                    label={item.title}
                    description={item.subtitle}
                    checked={accepted.has(item.id)}
                    onChange={(on) => set(item.id, on)}
                  />
                  {item.details && (
                    <p className="mt-2 ml-7 line-clamp-3 text-xs whitespace-pre-line text-slate-600">
                      {item.details}
                    </p>
                  )}
                  {item.duplicateOf && (
                    <p className="mt-2 ml-7 text-xs text-amber-700">
                      Looks like “{item.duplicateOf}” already in your profile — not added unless you
                      tick it.
                    </p>
                  )}
                  {item.note && <p className="mt-1 ml-7 text-xs text-slate-500">{item.note}</p>}
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {byGroup.tags.length > 0 && (
        <Card
          title="Skills & languages"
          description="Only skills you don’t have yet. Click to include or exclude."
        >
          {(['skills', 'languages'] as const).map((group) => {
            const tags = byGroup.tags.filter((t) => t.group === group);
            if (!tags.length) return null;
            return (
              <div key={group} className="mb-3">
                <p className="mb-1.5 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {group === 'skills' ? 'Skills' : 'Languages'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => {
                    const on = accepted.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set(t.id, !on)}
                        className={cx(
                          'rounded-md px-2 py-1 text-xs font-medium ring-1',
                          on
                            ? 'ring-brand-200 bg-brand-50 text-brand-700'
                            : 'bg-white text-slate-400 line-through ring-slate-200',
                        )}
                      >
                        {t.tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {file && (
        <Card>
          <CheckboxField
            label="Also save this file as your resume"
            description={
              profile.resume
                ? `Replaces ${profile.resume.fileName}. Stored only on this device.`
                : 'Used to attach your resume to applications. Stored only on this device.'
            }
            checked={saveFile}
            onChange={setSaveFile}
          />
        </Card>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => void save()} loading={saving} disabled={changes === 0}>
          {changes === 0
            ? 'Nothing selected'
            : `Save ${changes} ${changes === 1 ? 'change' : 'changes'}`}
        </Button>
      </div>
    </div>
  );
}

function ScalarGroup({
  title,
  items,
  accepted,
  onSet,
}: {
  title: string;
  items: Array<Extract<ReviewItem, { kind: 'scalar' }>>;
  accepted: Set<string>;
  onSet: (id: string, on: boolean) => void;
}) {
  if (!items.length) return null;
  return (
    <Card title={title}>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="py-3 first:pt-0 last:pb-0">
            {item.status === 'new' ? (
              <CheckboxField
                label={item.label}
                description={item.extracted}
                checked={accepted.has(item.id)}
                onChange={(on) => onSet(item.id, on)}
              />
            ) : (
              <ConflictRow
                label={item.label}
                existing={item.existing}
                extracted={item.extracted}
                useResume={accepted.has(item.id)}
                onChoose={(useResume) => onSet(item.id, useResume)}
              />
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 *   Existing:  Software Engineer
 *   Resume:    AI Engineer
 *   [Keep Existing] [Use Resume Value]
 */
function ConflictRow({
  label,
  existing,
  extracted,
  useResume,
  onChoose,
}: {
  label: string;
  existing: string;
  extracted: string;
  useResume: boolean;
  onChoose: (useResume: boolean) => void;
}) {
  return (
    <div role="group" aria-label={`${label}: choose a value`}>
      <p className="text-sm font-medium text-slate-900">
        {label}{' '}
        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
          Differs
        </span>
      </p>
      <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-[5rem_1fr]">
        <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Existing</dt>
        <dd
          className={cx(
            'break-words',
            !useResume ? 'text-slate-900' : 'text-slate-400 line-through',
          )}
        >
          <Clamp>{existing}</Clamp>
        </dd>
        <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Resume</dt>
        <dd className={cx('break-words', useResume ? 'text-slate-900' : 'text-slate-400')}>
          <Clamp>{extracted}</Clamp>
        </dd>
      </dl>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant={!useResume ? 'primary' : 'secondary'}
          aria-pressed={!useResume}
          onClick={() => onChoose(false)}
        >
          Keep Existing
        </Button>
        <Button
          size="sm"
          variant={useResume ? 'primary' : 'secondary'}
          aria-pressed={useResume}
          onClick={() => onChoose(true)}
        >
          Use Resume Value
        </Button>
      </div>
    </div>
  );
}

function Clamp({ children }: { children: ReactNode }) {
  return <span className="line-clamp-3 whitespace-pre-line">{children}</span>;
}
