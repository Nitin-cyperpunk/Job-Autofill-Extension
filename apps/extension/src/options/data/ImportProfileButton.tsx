import { useRef, useState } from 'react';
import type { Profile } from '@jobfill/types';
import { IMPORT_MAX_BYTES, fullName, parseImportFile, type ImportResult } from '@jobfill/shared';
import { Alert } from '@/components/ui/Alert';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UploadIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';

type ParsedImport = Extract<ImportResult, { ok: true }>;

interface ImportProfileButtonProps {
  /** Mark onboarding as done after importing (dashboard) or leave it for the review step. */
  completeOnboarding: boolean;
  onImported?: (profile: Profile) => void;
  buttonProps?: ButtonProps;
}

/** Pick a JobFill export, preview what's in it, then replace the current profile. */
export function ImportProfileButton({
  completeOnboarding,
  onImported,
  buttonProps,
}: ImportProfileButtonProps) {
  const { profile: current, importProfile } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState('');

  async function onFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setError('');
    if (file.size > IMPORT_MAX_BYTES) {
      setError('This file is too large to be a JobFill export.');
      return;
    }
    const result = parseImportFile(await file.text());
    if (result.ok) setParsed(result);
    else setError(result.error);
  }

  async function confirmImport() {
    if (!parsed) return;
    const now = new Date().toISOString();
    const next: Profile = {
      ...parsed.profile,
      createdAt: current.createdAt ?? parsed.profile.createdAt,
      onboardingCompletedAt: completeOnboarding
        ? (parsed.profile.onboardingCompletedAt ?? now)
        : null,
    };
    const saved = await importProfile(next, parsed.resume);
    onImported?.(saved);
  }

  const p = parsed?.profile;
  const hasExisting = Boolean(current.updatedAt);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label="Choose a JobFill export file"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Button
        variant="secondary"
        icon={<UploadIcon />}
        {...buttonProps}
        onClick={() => inputRef.current?.click()}
      >
        {buttonProps?.children ?? 'Import profile'}
      </Button>
      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}

      <ConfirmDialog
        open={parsed !== null}
        title={hasExisting ? 'Replace your current profile?' : 'Import this profile?'}
        description={
          hasExisting
            ? 'Your current profile and resume on this device will be replaced by the imported file.'
            : 'The profile will be saved on this device.'
        }
        confirmLabel={hasExisting ? 'Replace profile' : 'Import profile'}
        tone={hasExisting ? 'danger' : 'primary'}
        onConfirm={confirmImport}
        onClose={() => setParsed(null)}
      >
        {p && parsed && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-900">
              {fullName(p.personal) || 'Unnamed profile'}
            </p>
            {p.personal.email && <p className="text-slate-600">{p.personal.email}</p>}
            <p className="mt-2 text-xs text-slate-500">
              {[
                `${p.education.length} education`,
                `${p.experience.length} experience`,
                `${p.projects.length} projects`,
                parsed.resume ? `resume: ${parsed.resume.fileName}` : 'no resume',
              ].join(' · ')}
            </p>
            {parsed.warnings.map((w) => (
              <p key={w} className="mt-2 text-xs font-medium text-amber-700">
                {w}
              </p>
            ))}
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
