import Link from 'next/link';
import type { ReactNode } from 'react';
import { AddToChromeButton, LockIcon, TryButton } from './ui';

/** A call to action inside an article, styled apart from the prose. */
export function InlineCta({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="not-prose my-10 rounded-xl border border-accent-line bg-accent-soft p-6">
      <p className="text-lg font-semibold text-fg">{title}</p>
      <div className="mt-2 text-body">{children}</div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <AddToChromeButton />
        <TryButton />
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
        <LockIcon className="h-4 w-4 text-ok" /> Your profile stays on your device.
      </p>
    </aside>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-ok bg-ok-soft px-5 py-4 text-body">{children}</div>
  );
}

export { Link };
