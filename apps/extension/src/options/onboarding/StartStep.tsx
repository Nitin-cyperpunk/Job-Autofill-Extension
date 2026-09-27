import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, FileTextIcon, PencilIcon, UploadIcon } from '@/components/ui/icons';
import { ImportProfileButton } from '../data/ImportProfileButton';

/** "Create profile": from your resume, from scratch, or from a JobFill export. */
export function StartStep({
  onResume,
  onScratch,
  onImported,
  onBack,
}: {
  onResume: () => void;
  onScratch: () => void;
  onImported: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="text-center text-3xl font-bold tracking-tight text-fg">Create your profile</h1>
      <p className="mt-3 text-center text-muted">How would you like to begin?</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={onResume}
          className="group rounded-xl border-2 border-accent bg-surface p-6 text-left shadow-card transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileTextIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-fg">Start from your resume</p>
          <p className="mt-1 text-sm text-muted">
            We read it on this device and fill in what we find. You review everything first.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent group-hover:underline">Upload →</p>
        </button>

        <button
          type="button"
          onClick={onScratch}
          className="group rounded-xl border border-line bg-surface p-6 text-left shadow-card transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-subtle-2 text-body">
            <PencilIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-fg">Start from scratch</p>
          <p className="mt-1 text-sm text-muted">
            We’ll guide you section by section. Only your name and email are required.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent group-hover:underline">Start →</p>
        </button>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-subtle-2 text-body">
            <UploadIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-fg">Import a backup</p>
          <p className="mt-1 text-sm text-muted">
            Restore a profile you exported from JobFill on this or another device.
          </p>
          <div className="mt-4">
            <ImportProfileButton
              completeOnboarding={false}
              onImported={onImported}
              buttonProps={{ size: 'sm', children: 'Choose export file' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
