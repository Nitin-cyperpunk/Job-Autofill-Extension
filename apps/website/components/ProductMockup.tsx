import { CheckIcon, LockIcon } from './ui';

/**
 * An illustration of the extension popup next to an application form, drawn in
 * HTML/CSS: sharp at any size, no image download. The example values are fictional
 * and labelled as an illustration.
 */
export function ProductMockup() {
  const fields = [
    { label: 'First name', value: 'Ada', filled: true },
    { label: 'Email', value: 'ada@example.com', filled: true },
    { label: 'Phone', value: '+44 20 7946 0000', filled: true },
    { label: 'LinkedIn profile', value: 'linkedin.com/in/ada', filled: true },
    { label: 'Why do you want to work here?', value: '', filled: false },
  ];
  return (
    <figure className="relative mx-auto w-full max-w-xl">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-raised sm:p-6">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-subtle-2" />
        </div>
        <p className="mt-5 text-sm font-semibold text-fg">Application form</p>
        <div className="mt-3 space-y-3">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs font-medium text-muted">{f.label}</p>
              <div
                className={
                  f.filled
                    ? 'mt-1 rounded-lg border border-ok-line bg-ok-soft px-3 py-2 text-sm text-fg'
                    : 'mt-1 h-14 rounded-lg border border-warn-line bg-warn-soft px-3 py-2 text-sm text-warn'
                }
              >
                {f.filled ? f.value : 'Needs your answer'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -right-2 -bottom-10 w-64 rounded-xl border border-line bg-surface p-4 shadow-raised sm:-right-10">
        <p className="text-sm font-semibold text-fg">JobFill</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-ok">
          <CheckIcon className="h-4 w-4" /> JobFill filled 4 fields
        </p>
        <p className="mt-1 text-sm text-warn">⚠ 1 field requires review</p>
        <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
          Review the form, then submit it yourself.
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <LockIcon className="h-3.5 w-3.5 text-ok" /> Profile stored on this device
        </p>
      </div>
      <figcaption className="sr-only">
        Illustration: JobFill fills the matching fields of an application form and flags an open
        question for you to answer.
      </figcaption>
    </figure>
  );
}
