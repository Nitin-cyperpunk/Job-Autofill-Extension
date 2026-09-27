import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Profile, SectionId, SectionValue } from '@jobfill/types';
import { prepareSection, validateDraft, type FieldErrors } from '@jobfill/shared';
import { Alert } from '@/components/ui/Alert';
import { useProfile } from '@/profile/profile-context';
import { SECTIONS } from './registry';

export interface EditorActionsState {
  saving: boolean;
  dirty: boolean;
  /** Discard the draft and restore the saved value. */
  reset: () => void;
}

interface SectionEditorProps<K extends SectionId> {
  id: K;
  /** Rendered in the footer. Must include a type="submit" button to save. */
  actions: (state: EditorActionsState) => ReactNode;
  onSaved?: (profile: Profile) => void;
}

/**
 * Holds a draft of one section. On submit it cleans, validates and saves just that
 * section, so saving never overwrites changes made elsewhere (e.g. a resume upload).
 */
export function SectionEditor<K extends SectionId>({
  id,
  actions,
  onSaved,
}: SectionEditorProps<K>) {
  const { profile, saveSection } = useProfile();
  const def = SECTIONS[id];
  const saved = profile[id] as SectionValue<K>;
  const [draft, setDraft] = useState<SectionValue<K>>(saved);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  // Validate live only after the first save attempt, so users aren't nagged while typing.
  const errors: FieldErrors = submitted ? validateDraft(id, draft) : {};
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = prepareSection(id, draft);
    setDraft(result.value);
    setSubmitted(true);
    setSaveError('');
    if (!result.valid) {
      // Let React render the error state, then move focus to the first problem.
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setSaving(true);
    try {
      const next = await saveSection(id, result.value);
      setSubmitted(false);
      onSaved?.(next);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const Form = def.Form;
  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      <Form value={draft} onChange={setDraft} errors={errors} />
      {errorCount > 0 && (
        <Alert tone="error">
          Please fix{' '}
          {errorCount === 1 ? 'the highlighted field' : `${errorCount} highlighted fields`} before
          saving.
        </Alert>
      )}
      {saveError && <Alert tone="error">{saveError}</Alert>}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
        {actions({
          saving,
          dirty,
          reset: () => {
            setDraft(saved);
            setSubmitted(false);
          },
        })}
      </div>
    </form>
  );
}
