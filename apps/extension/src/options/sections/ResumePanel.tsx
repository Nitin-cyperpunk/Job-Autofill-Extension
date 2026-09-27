import { useRef, useState, type DragEvent } from 'react';
import { RESUME_ACCEPT_ATTR, formatBytes } from '@jobfill/shared';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CheckIcon,
  DownloadIcon,
  FileTextIcon,
  TrashIcon,
  UploadIcon,
} from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { loadResume } from '@/storage';
import { base64ToBlob, downloadBlob } from '@/utils/file';
import { cx } from '@/utils/cx';

/** Upload / replace / download / delete the resume. Changes are saved immediately. */
export function ResumePanel() {
  const { profile, uploadResume, removeResume } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const resume = profile.resume;

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await uploadResume(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function download() {
    const stored = await loadResume();
    if (!stored) {
      setError('The resume file could not be read. Try uploading it again.');
      return;
    }
    downloadBlob(base64ToBlob(stored.dataBase64, stored.mimeType), stored.fileName);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void upload(e.dataTransfer.files[0]);
  }

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept={RESUME_ACCEPT_ATTR}
      className="sr-only"
      aria-label="Choose resume file"
      onChange={(e) => void upload(e.target.files?.[0])}
    />
  );

  return (
    <div className="space-y-3">
      {resume ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-subtle p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface text-accent ring-1 ring-line">
            <FileTextIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{resume.fileName}</p>
            <p className="text-xs text-muted">
              {formatBytes(resume.sizeBytes)} · Uploaded{' '}
              {new Date(resume.uploadedAt).toLocaleDateString()}
            </p>
            <p className="mt-1 flex animate-fade items-center gap-1 text-xs font-medium text-ok">
              <CheckIcon className="h-3.5 w-3.5 animate-pop" /> Resume saved locally
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<DownloadIcon />} onClick={download}>
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<UploadIcon />}
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              Replace Resume
            </Button>
            <Button
              variant="danger-ghost"
              size="sm"
              icon={<TrashIcon />}
              onClick={() => setConfirmDelete(true)}
            >
              Remove
            </Button>
          </div>
          {picker}
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-accent-line',
            dragging
              ? 'border-accent bg-accent-soft'
              : 'border-line-strong hover:border-accent hover:bg-subtle',
          )}
        >
          {picker}
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            {busy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
              <UploadIcon className="h-5 w-5" />
            )}
          </span>
          <span className="text-sm font-medium text-fg">
            {busy ? 'Saving…' : 'Drop your resume here, or click to browse'}
          </span>
          <span className="mt-1 text-xs text-muted">
            PDF, DOC or DOCX · up to 5 MB · stored only on this device
          </span>
        </label>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <ConfirmDialog
        open={confirmDelete}
        title="Remove your resume?"
        description="The file will be removed from this device. You can upload it again at any time."
        confirmLabel="Remove resume"
        tone="danger"
        onConfirm={async () => {
          await removeResume();
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
