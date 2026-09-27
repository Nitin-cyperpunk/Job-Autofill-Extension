import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, PencilIcon, UploadIcon } from '@/components/ui/icons';
import { ImportProfileButton } from '../data/ImportProfileButton';

/** "Create profile": start from scratch, or restore a JobFill export. */
export function StartStep({
  onScratch,
  onImported,
  onBack,
}: {
  onScratch: () => void;
  onImported: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
        Create your profile
      </h1>
      <p className="mt-3 text-center text-slate-600">How would you like to begin?</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onScratch}
          className="group rounded-2xl border-2 border-brand-500 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <PencilIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-slate-900">Start from scratch</p>
          <p className="mt-1 text-sm text-slate-600">
            We’ll guide you section by section. Only your name and email are required.
          </p>
          <p className="mt-4 text-sm font-semibold text-brand-600 group-hover:underline">Start →</p>
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <UploadIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-slate-900">Import a backup</p>
          <p className="mt-1 text-sm text-slate-600">
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
